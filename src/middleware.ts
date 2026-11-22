import { NextRequest, NextResponse } from 'next/server';
import { bareHost, isOwnHost } from '@/lib/hosts';

const PUBLIC = ['/sign-in', '/reset-password', '/invite'];
const API_BASE = (process.env.API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const APP_URL = (process.env.APP_URL ?? 'http://localhost:3001').replace(/\/$/, '');
const CACHE_MS = 60_000;

// shortcut: per-instance cache, so a deactivated domain keeps working up to CACHE_MS on a warm instance; fine for staff review.
const approved = new Map<string, { ok: boolean; until: number }>();

// Is `host` an approved (active) custom domain? GET /v1/hosts/resolve answers 404 for pending, failed or unknown hosts.
// If the API cannot answer, let the request through uncached: the page then shows its own error, never a wrong redirect.
async function isApproved(host: string): Promise<boolean> {
  const hit = approved.get(host);
  if (hit && hit.until > Date.now()) return hit.ok;
  const res = await fetch(`${API_BASE}/v1/hosts/resolve?host=${encodeURIComponent(host)}`, { cache: 'no-store' }).catch(() => null);
  if (!res || (res.status !== 200 && res.status !== 404)) return true;
  const ok = res.status === 200;
  approved.set(host, { ok, until: Date.now() + CACHE_MS });
  return ok;
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  // A custom domain opens the console only once WorkBeat approved it (custom-domain, A17); API calls included.
  const host = bareHost(req.headers.get('host'));
  if (!isOwnHost(host) && !(await isApproved(host))) {
    return pathname.startsWith('/api/')
      ? NextResponse.json({ error: 'This address is not active', code: 'NOT_FOUND' }, { status: 404 })
      : NextResponse.redirect(`${APP_URL}/sign-in`);
  }
  if (pathname.startsWith('/api/')) return NextResponse.next();

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

export const config = { matcher: ['/((?!_next/|favicon.ico).*)'] };
