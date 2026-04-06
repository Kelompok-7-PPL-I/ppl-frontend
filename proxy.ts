import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options })
          response = NextResponse.next({ request: { headers: request.headers } })
          response.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname


  const isProtectedPath = path.startsWith('/admin') || path.startsWith('/DashboardProduct') || path.startsWith('/DetailProduct') || path.startsWith('/Cart') || path.startsWith('/Checkout');
  const isAuthPath = path === '/auth';

  if (!user && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

if (user) {
    const userRole = user.user_metadata?.role || 'user'; 

    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/DashboardProduct', request.url))
    }

    if (path === '/auth') {
      const targetPath = userRole === 'admin' ? '/admin' : '/DashboardProduct';
      return NextResponse.redirect(new URL(targetPath, request.url))
    }
    
  }

  return response
}

export default proxy;


export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}