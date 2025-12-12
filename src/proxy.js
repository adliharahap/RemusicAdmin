import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Daftar role yang diizinkan masuk ke Panel Aplikasi
const allowedRoles = ['owner', 'uploader', 'admin'] 

export async function proxy(request) {
  const url = new URL(request.url)
  const pathname = url.pathname

  // --- 1. EARLY EXIT: File Statis & API ---
  if (
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api') || 
    pathname.startsWith('/static') || 
    pathname.includes('.') || 
    pathname === '/favicon.ico' ||
    pathname === '/not-found'
  ) {
    return NextResponse.next()
  }

  // --- 2. SETUP SUPABASE ---
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // --- 3. HELPER REDIRECT AMAN ---
  const safeRedirect = (targetPath) => {
    const targetUrl = new URL(targetPath, request.url)
    if (pathname === targetPath) return response; 
    
    const redirectRes = NextResponse.redirect(targetUrl)
    response.cookies.getAll().forEach(cookie => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie)
    })
    return redirectRes
  }

  // --- 4. CEK USER ---
  const { data: { user } } = await supabase.auth.getUser()

  const loginUrl = '/login'
  const notFoundUrl = '/not-found'
  const homeUrl = '/' // Halaman Hub (Pilihan Aplikasi)

  // =========================================================
  // LOGIKA RUTE
  // =========================================================

  // KASUS A: Root ('/') -> Halaman Hub
  if (pathname === '/') {
    // Jika belum login, suruh login dulu
    if (!user) {
        return safeRedirect(loginUrl)
    }
    // Jika sudah login, BIARKAN MASUK (karena di sini ada menu pilihan Remusic/Hiyori)
    return response 
  }

  // KASUS B: Halaman Login
  if (pathname === '/login') {
    if (user) {
      // Sudah login? Balik ke Home
      return safeRedirect(homeUrl)
    }
    return response
  }

  // KASUS C: Protected Apps (/remusic DAN /hiyorinime)
  // Kita cek apakah URL diawali dengan salah satu aplikasi admin kita
  if (pathname.startsWith('/remusic') || pathname.startsWith('/hiyorinime')) {
    
    // 1. Belum Login -> Tendang ke Login
    if (!user) {
      return safeRedirect(loginUrl)
    }

    // 2. Cek Role di Database (Tabel 'users')
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()

    // 3. Validasi Role
    // Jika error, data tidak ada, atau role tidak diizinkan -> 404
    if (error || !userData || !allowedRoles.includes(userData.role)) {
      console.log(`⛔ Access Denied: ${user.email} role: ${userData?.role}`);
      return safeRedirect(notFoundUrl)
    }

    // Lolos semua cek -> Silakan masuk
    return response
  }

  return response
}

export const config = {
  matcher: [
    // Matcher ketat: abaikan semua file statis/gambar
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}