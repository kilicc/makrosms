import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    const url = request.nextUrl.clone();
    const hostname = request.headers.get('host') || '';
    
    // Subdomain'i al (support.makrosms.com -> support)
    const parts = hostname.split('.');
    const subdomain = parts.length > 2 ? parts[0] : '';
    
    // Kısa linkler subdomain (support.makrosms.com)
    if (subdomain === 'support') {
      try {
        // API route'ları ve Next.js internal route'ları hariç tut
        if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
          return NextResponse.next();
        }
        
        // Root path'e gidiyorsa ana sayfaya yönlendir
        if (url.pathname === '/') {
          url.pathname = '/login';
          return NextResponse.redirect(url);
        }
        
        // Kısa kod path'i (/[shortCode]) - API'ye yönlendir
        const pathParts = url.pathname.split('/').filter(Boolean);
        if (pathParts.length === 1 && pathParts[0] && !pathParts[0].includes('.')) {
          // Kısa kod gibi görünüyor, API'ye yönlendir
          const shortCode = pathParts[0];
          url.pathname = `/api/short-links/${shortCode}`;
          return NextResponse.rewrite(url);
        }
        
        // Diğer path'ler için normal çalış
        return NextResponse.next();
      } catch (error) {
        // Hata durumunda normal devam et
        console.error('Support subdomain middleware error:', error);
        return NextResponse.next();
      }
    }
  
    // Ana domain (makrosms.com) - hem admin hem kullanıcılar için
    // API route'ları ve Next.js internal route'ları hariç tut
    if (url.pathname.startsWith('/api') || url.pathname.startsWith('/_next')) {
      return NextResponse.next();
    }
    
    // Login ve register sayfalarına erişim serbest
    if (url.pathname === '/login' || url.pathname.startsWith('/login') || 
        url.pathname === '/register' || url.pathname.startsWith('/register')) {
      return NextResponse.next();
    }
    
    // Localhost geliştirme için
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('localhost:')) {
      return NextResponse.next();
    }
    
    // Ana domain için tüm path'lere izin ver
    // Client-side'da ProtectedRoute kontrolü yapılacak
    // Protected path'ler: /admin, /sms, /dashboard, /contacts, /reports, /payment, /profile, vb.
    return NextResponse.next();
  } catch (error) {
    // Hata durumunda normal devam et
    console.error('Middleware error:', error);
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

