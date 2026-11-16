import { NextRequest, NextResponse } from 'next/server';

const PUBLIC = ['/sign-in', '/reset-password', '/invite'];

export function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const isPublic = PUBLIC.some((p) => pathname === p || pathname.startsWith(p + '/'));
  if (!isPublic && !req.cookies.has('wb_session')) {
    const url = new URL('/sign-in', req.url);
    if (pathname !== '/') url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  // The (app) layout guards by role from the path.
  const headers = new Headers(req.headers);
  headers.set('x-pathname', pathname);
  const res = NextResponse.next({ request: { headers } });
  res.headers.set('cache-control', 'no-store'); // Back after sign-out must not show company data.
  return res;
}

export const config = { matcher: ['/((?!api/|_next/|favicon.ico).*)'] };
