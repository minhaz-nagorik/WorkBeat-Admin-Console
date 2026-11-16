import { NextRequest, NextResponse } from 'next/server';
import { API_BASE, SESSION_COOKIE } from '@/lib/api-server';

// Same-origin proxy: the browser calls /api/v1/..., this adds the bearer token from the cookie.
// Answers that carry a session token set the cookie and drop the token from the body (A2).
const SESSION_ROUTES = new Set(['v1/auth/login', 'v1/invitations/accept']);

async function proxy(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const path = (await ctx.params).path.join('/');
  if (!path.startsWith('v1/')) return NextResponse.json({ error: 'Not found', code: 'NOT_FOUND' }, { status: 404 });
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const headers = new Headers();
  for (const h of ['content-type', 'accept']) { const v = req.headers.get(h); if (v) headers.set(h, v); }
  if (token) headers.set('authorization', `Bearer ${token}`);
  const fwd = req.headers.get('x-forwarded-for'); if (fwd) headers.set('x-forwarded-for', fwd);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/${path}${req.nextUrl.search}`, {
      method: req.method, headers, cache: 'no-store',
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : await req.arrayBuffer(),
    });
  } catch {
    return NextResponse.json({ error: 'API unreachable', code: 'NETWORK' }, { status: 502 });
  }

  const out = new Headers();
  for (const h of ['content-type', 'retry-after', 'content-disposition']) { const v = res.headers.get(h); if (v) out.set(h, v); }

  if (SESSION_ROUTES.has(path) && res.ok) {
    const body = await res.json(); // { data: { token?, expires_at, ... } } (backend api-envelope)
    const { token, ...rest } = body.data ?? {};
    const r = NextResponse.json({ data: rest }, { status: res.status, headers: out });
    if (token) setSession(r, token, rest.expires_at);
    return r;
  }
  const r = new NextResponse(res.status === 204 ? null : res.body, { status: res.status, headers: out });
  if (path === 'v1/auth/logout' || res.status === 401) r.cookies.delete(SESSION_COOKIE);
  return r;
}

function setSession(r: NextResponse, token: string, expiresAt: string) {
  r.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/', expires: new Date(expiresAt),
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as PATCH, proxy as DELETE };
