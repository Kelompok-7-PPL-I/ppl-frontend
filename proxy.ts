import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  // 1. Inisialisasi Supabase Client
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

  // 2. Cek User dari Supabase (Pengganti getToken)
  const { data: { user: supabaseUser } } = await supabase.auth.getUser()
  const path = request.nextUrl.pathname

  // Status login hanya berdasarkan Supabase 
  const isLogged = !!supabaseUser;

  // Rute yang butuh login
  const isProtectedPath = 
    path.startsWith('/admin') || 
    path.startsWith('/DashboardProduct') || 
    path.startsWith('/DetailProduct') || 
    path.startsWith('/cart') || 
    path.startsWith('/checkout') || 
    path.startsWith('/payment') || 
    path.startsWith('/profile') ||
    path.startsWith('/recipes');
    
  const isAuthPath = path === '/auth';

  // REDIRECT: Jika belum login tapi maksa masuk halaman terproteksi
  if (!isLogged && isProtectedPath) {
    return NextResponse.redirect(new URL('/auth', request.url))
  }

  // LOGIKA ROLE: Jika sudah login
  if (isLogged) {
    // Ambil role dari metadata user atau database
    let userRole = supabaseUser?.user_metadata?.role || 'customer';

    // Opsional: Ambil role real-time dari tabel 'pengguna' di database
    if (path.startsWith('/admin') || isAuthPath) {
      const { data: pengguna } = await supabase
        .from('pengguna') 
        .select('peran') 
        .eq('id', supabaseUser.id)
        .single();

      if (pengguna?.peran) {
        userRole = pengguna.peran;
      }
    }

    // PROTEKSI ADMIN: Selain admin dilarang masuk /admin
    if (path.startsWith('/admin') && userRole !== 'admin') {
      return NextResponse.redirect(new URL('/DashboardProduct', request.url))
    }

    // REDIRECT AUTH: Jika sudah login tapi ke halaman login (/auth), lempar ke dashboard
    if (isAuthPath) {
      const targetPath = userRole === 'admin' ? '/admin' : '/DashboardProduct';
      return NextResponse.redirect(new URL(targetPath, request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|logos|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

export default middleware;