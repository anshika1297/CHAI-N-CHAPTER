import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const FILTERED_LISTING_PATHS = new Set(['/blog', '/recommendations', '/musings']);

function applySecurityHeaders(response: NextResponse) {
  const securityHeaders = {
    'X-DNS-Prefetch-Control': 'on',
    'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
    'X-Frame-Options': 'SAMEORIGIN',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
  };

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  if (process.env.NODE_ENV === 'production') {
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://www.googletagmanager.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data: https://fonts.gstatic.com",
      "connect-src 'self' https:",
      "frame-ancestors 'self'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; ');
    response.headers.set('Content-Security-Policy', csp);
  }
}

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Canonical apex: www → non-www
  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.replace(/^www\./i, '');
    return NextResponse.redirect(url, 301);
  }

  const response = NextResponse.next();
  applySecurityHeaders(response);

  const { pathname, searchParams } = request.nextUrl;

  if (pathname.startsWith('/admin')) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
  }

  // Faceted listing URLs duplicate hub/listing content — do not index
  if (FILTERED_LISTING_PATHS.has(pathname) && searchParams.has('category')) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  // Search result pages — utility only
  if (pathname === '/search' && searchParams.toString()) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  // Filtered books directory — utility facet URLs
  if (pathname === '/books' && (searchParams.has('genre') || searchParams.has('page'))) {
    response.headers.set('X-Robots-Tag', 'noindex, follow');
  }

  return response;
}

export const config = {
  matcher: [
    '/',
    '/((?!api(?:/|$)|_next/|favicon.ico|robots.txt|sitemap.xml).+)',
  ],
};
