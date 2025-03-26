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
    
    // Call our getUserProfile function via RPC to ensure profile creation
    // This might be optional if your getUserProfile is called on every protected page
    const { error: rpcError } = await supabase.rpc('ensure_user_profile')
    
    if (rpcError) {
      console.error('Error ensuring user profile:', rpcError)
      // Don't fail the request, just log the error
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Refresh session error:', error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}