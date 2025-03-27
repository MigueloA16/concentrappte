import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Allow access to auth pages (sign-in, sign-up, verify, etc.)
  // Add callback route to the allowed paths
  const authPaths = [
    '/auth/sign-in',
    '/auth/sign-up',
    '/auth/verify',
    '/auth/callback',
    '/auth/forgot-password',
    '/auth/reset-password'
  ]
  const isAuthPath = authPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // Also allow access to the home page
  const isHomePage = request.nextUrl.pathname === '/'

  // Allow access to API routes
  const isApiRoute = request.nextUrl.pathname.startsWith('/api/')

  if (!user && !isAuthPath && !isHomePage && !isApiRoute) {
    // No user, redirect to the sign-in page with a return URL
    const returnUrl = encodeURIComponent(request.nextUrl.pathname)
    const url = new URL('/auth/sign-in', request.url)
    url.searchParams.set('returnUrl', returnUrl)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and tries to access auth pages, redirect to hub
  // Exception: allow reset-password and callback routes even if authenticated
  const allowedAuthPaths = ['/auth/callback', '/auth/reset-password']
  const isAllowedAuthPath = allowedAuthPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (user && isAuthPath && !isAllowedAuthPath) {
    return NextResponse.redirect(new URL('/hub', request.url))
  }

  return supabaseResponse
}