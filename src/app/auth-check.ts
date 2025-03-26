import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function getUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function requireUser() {
  const user = await getUser()
  
  if (!user) {
    redirect('/auth/sign-in')
  }
  
  return user
}

export async function getUserProfile() {
  try {
    const user = await requireUser()
    const supabase = await createClient()
    
    // First, check if profile exists
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching user profile:', profileError)
      throw profileError
    }
    
    // If profile doesn't exist, create it first
    if (!profile) {
      // Extract username with improved provider-specific handling
      const username = extractUsername(user);
      
      // Extract avatar URL
      const avatarUrl = extractAvatarUrl(user);
      
      console.log('Creating new profile for:', username, 'Avatar:', avatarUrl);
      
      // Add retry logic to handle potential race conditions
      let retries = 3;
      let newProfile = null;
      
      while (retries > 0 && !newProfile) {
        try {
          const { data, error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: username,
              avatar_url: avatarUrl,
              total_focus_time: 0,
              streak_days: 0,
              best_streak: 0,
              daily_motivation: "Focus on the process, not just the outcome",
              target_hours: 100,
              level_name: "Bronce"
            })
            .select('*')
            .single()
          
          if (insertError) {
            // If there's a conflict (profile was created by another concurrent process)
            // Try to fetch it instead
            if (insertError.code === '23505') { // Unique violation
              const { data: existingProfile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .single()
              
              if (existingProfile) {
                return existingProfile;
              }
            }
            
            throw insertError;
          }
          
          newProfile = data;
        } catch (error) {
          console.error(`Error creating profile (attempt ${4-retries}/3):`, error);
          retries--;
          
          if (retries > 0) {
            // Wait a bit before retrying
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
      }
      
      if (newProfile) {
        return newProfile;
      } else {
        console.error('Failed to create user profile after multiple attempts');
      }
    }
    
    // Handle existing profile with missing fields
    if (profile && (profile.best_streak === null || profile.best_streak === undefined || 
                   profile.daily_motivation === null || profile.target_hours === null)) {
      console.log('Updating profile with missing fields');
      
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          best_streak: profile.streak_days || 0,
          daily_motivation: profile.daily_motivation || "Focus on the process, not just the outcome",
          target_hours: profile.target_hours || 100,
          level_name: profile.level_name || "Bronce"
        })
        .eq('id', user.id)
        .select('*')
        .single()
      
      if (updateError) {
        console.error('Error updating user profile:', updateError)
        throw updateError
      }
      
      return updatedProfile
    }
    
    return profile
  } catch (error) {
    console.error('Error in getUserProfile:', error)
    // Return a minimal profile to avoid breaking the UI
    return null
  }
}

// Helper function to extract username from various auth providers
function extractUsername(user) {
  // Check if user has the provider field to determine where they registered from
  const provider = user.app_metadata?.provider;
  
  if (provider === 'github') {
    // GitHub-specific username extraction
    return user.user_metadata?.user_name || 
           user.user_metadata?.preferred_username ||
           user.user_metadata?.name ||
           user.email?.split('@')[0] ||
           'GitHub User';
  } 
  else if (provider === 'google') {
    // Google-specific username extraction
    // First check for name fields
    const fullName = user.user_metadata?.full_name || 
                     user.user_metadata?.name || 
                     user.user_metadata?.given_name;
    
    if (fullName) {
      // Create a username from the first name or first part of full name
      const nameParts = fullName.split(' ');
      if (nameParts.length > 0 && nameParts[0]) {
        return nameParts[0]; // Use first name as username
      }
    }
    
    // If no name is available, check for email
    if (user.email) {
      return user.email.split('@')[0];
    }
    
    // Log what we received from Google to help with debugging
    console.log('Google user metadata:', user.user_metadata);
    
    return 'Google User';
  }
  
  // Default/Email user extraction
  return user.user_metadata?.username || 
         user.email?.split('@')[0] || 
         'User';
}

// Helper function to extract avatar URL from various auth providers
function extractAvatarUrl(user) {
  // Added more possible fields where the avatar URL might be
  return user.user_metadata?.avatar_url || 
         user.user_metadata?.picture || // Google often uses 'picture'
         user.user_metadata?.avatar ||
         user.user_metadata?.photoURL ||
         null;
}