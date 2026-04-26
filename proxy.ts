import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getToken } from "next-auth/jwt";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 1. Ambil Token dari NextAuth
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET
  });

  // 2. Setup Supabase Client untuk pengecekan session/db
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

  // Status Login (NextAuth atau Supabase)
  const isLogged = !!token || !!supabaseUser;

  // Rute yang membutuhkan login
  const isProtectedPath = 
    path.startsWith('/admin') || 
    path.startsWith('/DashboardProduct') || 
    path.startsWith('/DetailProduct') || 
    path.startsWith('/cart') || 
    path.startsWith('/checkout') || 
    path.startsWith('/payment') || 
    path.startsWith('/profile') ||
    path.startsWith('/recipes');
    
  const isAuthPath = path === '/auth' || path.startsWith('/register');

  // REDIRECT 1: Jika belum login tapi coba akses halaman terproteksi
  if (!isLogged && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // REDIRECT 2: Jika sudah login
  if (isLogged) {
    // Ambil role awal dari token atau metadata
    let userRole = (token?.peran as string) || supabaseUser?.user_metadata?.role || 'customer';

    // Jika akses area sensitif, ambil data terupdate dari tabel pengguna (database)
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

    // Proteksi Admin: Bukan admin tidak boleh masuk /admin
    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/DashboardProduct', request.url))
    }

    // Halaman Auth: User yang sudah login tidak boleh ke /auth atau /register
    if (isAuthPath) {
      const targetPath = userRole === 'admin' ? '/admin' : '/DashboardProduct';
      return NextResponse.redirect(new URL(targetPath, request.url))
    }
  }

  return response
}

// Next.js convention: gunakan default export untuk middleware/proxy
export default proxy;

export const config = {
  matcher: [
    /*
     * Match semua request kecuali:
     * 1. api (rute API Midtrans kamu aman di sini)
     * 2. _next/static (file statik)
     * 3. _next/image (optimasi gambar)
     * 4. favicon.ico dan file gambar lainnya
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
