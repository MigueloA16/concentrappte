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
      const { data: newProfile, error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          username: user.user_metadata.username || user.email,
          avatar_url: user.user_metadata.avatar_url,
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
        console.error('Error creating user profile:', insertError)
        throw insertError
      }
      
      return newProfile
    }
    
    // Handle existing profile with missing fields
    if (profile.best_streak === null || profile.best_streak === undefined) {
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