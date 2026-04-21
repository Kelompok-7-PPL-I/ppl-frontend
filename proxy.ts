import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

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

  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Gabungkan status login: Next Auth ATAU Supabase
  const isLogged = !!token || !!supabaseUser;

  // Sesuaikan proteksi dengan rute-rute yang ada di project kamu
  const isProtectedPath = 
    path.startsWith('/admin') || 
    path.startsWith('/DashboardProduct') || 
    path.startsWith('/DetailProduct') || 
    path.startsWith('/cart') || 
    path.startsWith('/checkout') || 
    path.startsWith('/payment') || 
    path.startsWith('/profile')||
    path.startsWith('/recipes');
    
  const isAuthPath = path === '/auth';

  if (!isLogged && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }


if (isLogged) {
  let userRole = (token?.peran as string) || supabaseUser?.user_metadata?.role || 'customer';

  if (path.startsWith('/admin') || isAuthPath) {
    const { data: pengguna } = await supabase
      .from('pengguna') 
      .select('peran') 
      .eq('id', token?.sub || supabaseUser?.id)
      .single();

    if (pengguna?.peran) {
      userRole = pengguna.peran;
    }
  }

  if (path.startsWith('/admin') && userRole !== 'admin') {
    return NextResponse.redirect(new URL('/DashboardProduct', request.url))
  }

  if (isAuthPath) {
    const targetPath = userRole === 'admin' ? '/admin' : '/DashboardProduct';
    return NextResponse.redirect(new URL(targetPath, request.url))
  }
}

  return response
}

export default middleware;

export const config = {
  matcher: [
    // Hindari path API dan file statik Next.js
    '/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}