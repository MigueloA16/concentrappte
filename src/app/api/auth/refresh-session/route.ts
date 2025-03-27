// src/app/api/auth/refresh-session/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      return NextResponse.json(
        { error: "Failed to get session", details: sessionError.message },
        { status: 401 }
      )
    }
    
    if (!session) {
      return NextResponse.json(
        { error: "No active session" },
        { status: 401 }
      )
    }
    
    // Get the user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Failed to get user", details: userError?.message },
        { status: 401 }
      )
    }

    // For OAuth providers, extract identity information

    console.log("El user");
    console.log(user);
    let username = user.user_metadata?.username;
    let avatarUrl = user.user_metadata?.avatar_url;
    
    // If user came from OAuth, grab info from identities
    if (!username && user.identities && user.identities.length > 0) {
      // Try to get name from identity providers
      const identity = user.identities[0];
      const providerData = identity.identity_data;
      
      // Different providers use different field names
      username = providerData.user_name || 
                 providerData.name || 
                 providerData.full_name || 
                 providerData.email?.split('@')[0] || 
                 user.email?.split('@')[0];
                 
      // Get avatar URL if available
      avatarUrl = avatarUrl || providerData.avatar_url;
    }
    
    // Use upsert to create or update profile with username
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username || user.email?.split('@')[0],
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',  // if the profile exists, update it
      });
    
    if (profileError) {
      console.error('Error creating/updating user profile:', profileError);
      // Don't fail the request, just log the error
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Refresh session error:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}