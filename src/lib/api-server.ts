import 'server-only';
import { cookies } from 'next/headers';

// The session token lives only in this httpOnly cookie; browser JS never sees it (A2, rule 1).
export const SESSION_COOKIE = 'wb_session';
export const API_BASE = (process.env.API_BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export type ApiResult<T> = { status: number; data: T | null; error: { code: string; fields?: string[] } | null };

/** Server-side call to the WorkBeat API with the signed-in user's bearer token. */
export async function api<T>(path: string, init: RequestInit = {}): Promise<ApiResult<T>> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (token) headers.set('authorization', `Bearer ${token}`);
  if (init.body && !headers.has('content-type')) headers.set('content-type', 'application/json');
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers, cache: 'no-store' });
  const body = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok) return { status: res.status, data: (body?.data ?? null) as T, error: null };
  return { status: res.status, data: null, error: { code: body?.code ?? 'INTERNAL', fields: body?.fields } };
}
