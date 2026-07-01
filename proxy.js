import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function proxy(request) {
  const url = new URL(request.url)
  const isDummySupabase = !process.env.NEXT_PUBLIC_SUPABASE_URL || 
                          process.env.NEXT_PUBLIC_SUPABASE_URL.includes("dummy-project-id")

  // --- LOCAL FALLBACK MODE ---
  if (isDummySupabase) {
    const isLoggedIn = request.cookies.get("wifi_admin_logged_in")?.value === "true"

    if (url.pathname.startsWith('/admin')) {
      if (!isLoggedIn) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    if (url.pathname === '/login') {
      if (isLoggedIn) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }

    return NextResponse.next()
  }

  // --- SUPABASE LIVE MODE ---
  let supabaseResponse = NextResponse.next({
    request,
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value, options))
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

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (url.pathname.startsWith('/admin')) {
      if (!user) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
    }

    if (url.pathname === '/login') {
      if (user) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
  } catch (err) {
    // If Supabase connection fails on backend, redirect to login
    if (url.pathname.startsWith('/admin')) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/login',
  ],
}
