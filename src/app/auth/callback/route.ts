// src/app/auth/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_description = requestUrl.searchParams.get('error_description')

  if (error) {
    // If there's an error, redirect to sign-in with error params
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=${error}&error_description=${encodeURIComponent(
        error_description || 'Error during authentication'
      )}`
    )
  }

  if (!code) {
    // If no code is provided, redirect to sign-in
    return NextResponse.redirect(`${requestUrl.origin}/auth/sign-in?error=no_code_provided`)
  }

  // Create a Supabase client
  const supabase = await createClient()

  // Exchange the code for a session
  const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    console.error('Session error:', sessionError)
    return NextResponse.redirect(
      `${requestUrl.origin}/auth/sign-in?error=session_error&error_description=${encodeURIComponent(
        sessionError.message
      )}`
    )
  }

  try {
    // Get user info
    const { data: { user } } = await supabase.auth.getUser()
    
    if (user) {
      // Extract profile data from OAuth provider if available
      let username = user.user_metadata?.username || '';
      let avatarUrl = user.user_metadata?.avatar_url || '';
      
      if ((!username || username === '') && user.identities && user.identities.length > 0) {
        const identity = user.identities[0];
        const providerData = identity.identity_data;
        
        username = providerData.user_name || 
                   providerData.name || 
                   providerData.full_name || 
                   providerData.email?.split('@')[0] || 
                   user.email?.split('@')[0];
                   
        avatarUrl = avatarUrl || providerData.avatar_url;
      }
      
      // Ensure profile creation for OAuth users
      if (username) {
        await supabase.from('profiles').upsert({
          id: user.id,
          username: username,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      }
    }
  } catch (error) {
    console.error('Profile creation error:', error);
    // Continue even if profile creation fails
  }

  // If successful, redirect to hub
  return NextResponse.redirect(`${requestUrl.origin}/hub`)
}