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

  // If successful, redirect to hub
  return NextResponse.redirect(`${requestUrl.origin}/hub`)
}