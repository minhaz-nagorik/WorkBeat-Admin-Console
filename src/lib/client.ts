'use client';
import { useEffect, useRef } from 'react';
import type { ApiError } from './types';

export type CallResult<T> = { ok: true; status: number; data: T } | { ok: false; status: number; err: ApiError; retryAfter?: number };

/** Browser call through the same-origin proxy; the token never reaches this code (A2). */
export async function call<T>(method: string, path: string, body?: unknown): Promise<CallResult<T>> {
  let res: Response;
  try {
    res = await fetch(`/api${path}`, {
      method, headers: body === undefined ? undefined : { 'content-type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, status: 0, err: { code: 'NETWORK' } };
  }
  const json = res.status === 204 ? null : await res.json().catch(() => null);
  if (res.ok) return { ok: true, status: res.status, data: json?.data as T }; // { data } envelope
  // Signed-in pages: an ended session goes back to sign-in, keeping the address (api-access).
  if (res.status === 401 && !path.startsWith('/v1/auth/') && !path.startsWith('/v1/invitations/')) {
    location.assign(`/sign-in?expired=1&next=${encodeURIComponent(location.pathname + location.search)}`);
  }
  return { ok: false, status: res.status, err: json ?? { code: 'INTERNAL' }, retryAfter: Number(res.headers.get('retry-after')) || undefined };
}

/** Plain-language message for an error with no field to sit beside (A12). Never a raw code. */
export function message(status: number, code: string): string {
  if (status === 404 && code === 'NOT_FOUND') return 'This item no longer exists.';
  if (status === 403) return "You don't have access to this page.";
  return 'Something went wrong. Try again.';
}

/** Run `fn` every 30 s while the tab is visible, and once on becoming visible (A5). */
export function usePoll(fn: () => void, ms = 30_000) {
  const ref = useRef(fn);
  ref.current = fn;
  useEffect(() => {
    let t: ReturnType<typeof setInterval> | undefined;
    const start = () => { stop(); t = setInterval(() => ref.current(), ms); };
    const stop = () => { if (t) clearInterval(t); t = undefined; };
    const onVis = () => { if (document.hidden) stop(); else { ref.current(); start(); } };
    ref.current();
    if (!document.hidden) start();
    document.addEventListener('visibilitychange', onVis);
    return () => { stop(); document.removeEventListener('visibilitychange', onVis); };
  }, [ms]);
}
