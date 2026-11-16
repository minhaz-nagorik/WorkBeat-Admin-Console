'use client';
import { useCallback, useEffect, useState } from 'react';
import { call, message, usePoll } from './client';

export type DataState<T> = {
  data: T | null; loading: boolean; status: number | null; reload: () => Promise<void>;
  /** Replace the data in place (after a write answered with the new record). */
  set: (fn: (d: T | null) => T | null) => void;
};

/**
 * GET `path` (null = don't load). With `poll`, refetches every 30 s while visible (A5) without
 * clearing what is shown, so search, filter, page and open confirmations survive a poll.
 */
export function useData<T>(path: string | null, opts: { poll?: boolean } = {}): DataState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(!!path);
  const [status, setStatus] = useState<number | null>(null);

  const reload = useCallback(async () => {
    if (!path) return;
    const r = await call<T>('GET', path);
    if (r.ok) { setData(r.data); setStatus(null); } else setStatus(r.status || 500);
    setLoading(false);
  }, [path]);

  useEffect(() => { setLoading(!!path); setData(null); setStatus(null); reload(); }, [reload, path]);
  usePoll(() => { if (opts.poll && path) reload(); });
  return { data, loading, status, reload, set: setData };
}

/** Loading placeholder, no-access message or retry for a DataState; renders children with data. */
export function Loaded<T>({ s, children, rows = 3 }: { s: DataState<T>; children: (d: T) => React.ReactNode; rows?: number }) {
  if (s.status === 403) return <div className="card"><p>You don&apos;t have access to this page.</p></div>;
  if (s.status === 404) return <div className="card"><p>This item no longer exists.</p></div>;
  if (s.status) return (
    <div className="card row between"><span>{message(s.status, '')}</span><button className="btn" onClick={() => s.reload()}>Try again</button></div>
  );
  if (s.loading || s.data === null) return <Skeleton rows={rows} />;
  return <>{children(s.data)}</>;
}

export const Skeleton = ({ rows = 3 }: { rows?: number }) => (
  <div className="card stack" aria-busy="true" aria-label="Loading">
    {Array.from({ length: rows }, (_, i) => <div key={i} style={{ height: 14, borderRadius: 4, background: 'var(--surface-2)', width: `${90 - i * 12}%` }} />)}
  </div>
);

export function PageHead({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="pagehead">
      <div><h1>{title}</h1>{sub && <p>{sub}</p>}</div>
      {right}
    </div>
  );
}
