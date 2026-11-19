'use client';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData, Skeleton } from '@/lib/use-data';
import { call, message, type CallResult } from '@/lib/client';
import { Modal } from '@/components/confirm';
import { dayKey, full } from '@/lib/time';
import type { TabProps } from './tabs';
import { clock, longDay, presetRange, RangePicker, rangeLabel, useRetainedFrom, type Range } from '@/components/reports/kit';

// view_url and thumb_url are 5-minute signed links (A6, rule 4): they live only in this component's memory and in <img src>,
// never in storage, logs or our address. An expired link or a failed image refetches the loaded pages.
type Shot = { id: string; captured_at: string; device_id: string; hostname: string; view_url: string; thumb_url?: string | null; download_url: string; expires_at: string };
type Page = { screenshots_enabled: boolean; from: string; to: string; total: number; next_cursor: string | null; items: Shot[] };
type Feed = { enabled: boolean; from: string; to: string; total: number; items: Shot[]; cursor: string | null };

const every = (s: number) => (s % 3600 === 0 ? (s === 3600 ? 'every hour' : `every ${s / 3600} hours`) : `every ${Math.round(s / 60)} minutes`);
const expired = (s: Shot) => new Date(s.expires_at).getTime() - Date.now() < 5_000;
const uniq = (xs: Shot[]) => { const seen = new Set<string>(); return xs.filter((x) => !seen.has(x.id) && seen.add(x.id)); };

/** Follow the signed download link: storage answers with Content-Disposition: attachment and the file name. */
function save(s: Shot) {
  const a = document.createElement('a');
  a.href = s.download_url; a.rel = 'noopener';
  a.click();
}

function initialRange(sp: URLSearchParams, tz: string): Range {
  const from = sp.get('from') ?? sp.get('date'), to = sp.get('to') ?? sp.get('date');
  return from && to ? { preset: 'custom', from: from <= to ? from : to, to: from <= to ? to : from } : presetRange('today', tz);
}

export function EmployeeScreenshots({ employeeId, tz, role }: TabProps) {
  const sp = useSearchParams();
  const [range, setRange] = useState<Range>(() => initialRange(sp, tz));
  const [feed, setFeed] = useState<Feed | null>(null);
  const [status, setStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null); // screenshot id, never its link
  const min = useRetainedFrom(tz, employeeId);
  const settings = useData<{ screenshot_interval_seconds: number }>(`/v1/employees/${employeeId}/monitoring-settings`);
  const admin = role === 'company_admin';

  const base = `/v1/employees/${employeeId}/screenshots?from=${range.from}&to=${range.to}`;
  const baseRef = useRef(base);
  baseRef.current = base;
  const feedRef = useRef(feed);
  feedRef.current = feed;
  const last = useRef(0);

  /** Pages from the start until at least `want` items are held (or the range ends). */
  const fetchFrom = useCallback(async (want: number): Promise<Feed | number> => {
    const q = baseRef.current;
    let items: Shot[] = [], cursor: string | null = null, head: Page | null = null;
    do {
      const r: CallResult<Page> = await call<Page>('GET', `${q}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`);
      if (!r.ok) return r.status || 500;
      head ??= r.data;
      items = uniq([...items, ...r.data.items]);
      cursor = r.data.next_cursor;
    } while (cursor && items.length < want);
    return { enabled: head!.screenshots_enabled, from: head!.from, to: head!.to, total: head!.total, items, cursor };
  }, []);

  const apply = (q: string, r: Feed | number) => {
    if (q !== baseRef.current) return false; // the range changed while this was in flight
    if (typeof r === 'number') { setStatus(r); return false; }
    setStatus(null); setFeed(r); return true;
  };

  useEffect(() => {
    setFeed(null); setStatus(null); setOpen(null);
    const q = base;
    fetchFrom(1).then((r) => apply(q, r));
  }, [base, fetchFrom]);

  async function more(): Promise<Feed | null> {
    const f = feedRef.current;
    if (!f?.cursor) return f;
    setBusy(true);
    const q = baseRef.current;
    const r = await call<Page>('GET', `${q}&cursor=${encodeURIComponent(f.cursor)}`);
    setBusy(false);
    if (q !== baseRef.current) return null;
    if (!r.ok) { setNote(message(r.status, r.err.code)); return null; }
    setNote(null);
    const n = { ...f, total: r.data.total, items: uniq([...f.items, ...r.data.items]), cursor: r.data.next_cursor };
    setFeed(n);
    return n;
  }

  // Refetch every loaded page for fresh links, at most every 10 s so a broken image can't loop.
  const refresh = async () => {
    if (Date.now() - last.current < 10_000) return;
    last.current = Date.now();
    const q = baseRef.current;
    apply(q, await fetchFrom(feedRef.current?.items.length ?? 1));
  };
  const pick = (r: Range) => { if (!min || r.to >= min) setRange(min && r.from < min ? { ...r, from: min } : r); };

  if (status === 404) return <div className="card"><p>This employee isn&apos;t on your team or no longer exists.</p></div>;
  if (status === 403) return <div className="card"><p>You don&apos;t have access to this page.</p></div>;
  if (status) return <div className="card row between"><span>{message(status, '')}</span><button className="btn" onClick={() => { setStatus(null); fetchFrom(1).then((r) => apply(base, r)); }}>Try again</button></div>;
  if (!feed) return <Skeleton rows={4} />;
  const interval = settings.data?.screenshot_interval_seconds;

  if (!feed.enabled) return (
    <div className="card stack" style={{ alignItems: 'flex-start' }}>
      <h2>Screenshots are off</h2>
      <p className="muted">Your company&apos;s plan doesn&apos;t include screenshots.</p>
      {admin && <p className="small muted">Contact WorkBeat to change your plan.</p>}
    </div>
  );

  const picker = <RangePicker value={range} onChange={pick} tz={tz} min={min} />;
  const list = feed.items.length ? (
    <>
      <p className="small muted">{feed.total} {feed.total === 1 ? 'screenshot' : 'screenshots'} · newest first{feed.items.length < feed.total ? ` · showing ${feed.items.length}` : ''}</p>
      <Days items={feed.items} tz={tz} multi={feed.from !== feed.to} onOpen={setOpen} onBroken={refresh} />
      {feed.cursor && <button className="btn" style={{ alignSelf: 'center' }} disabled={busy} onClick={() => more()}>{busy ? 'Loading…' : 'Load more'}</button>}
    </>
  ) : <p className="muted">No screenshots were taken {feed.from === feed.to ? `on ${longDay(feed.from)}` : 'in this range'}.</p>;
  const viewer = <Viewer feed={feed} id={open} setId={setOpen} tz={tz} refresh={refresh} more={more} />;

  if (interval === 0) return (
    <div className="card stack" style={{ alignItems: 'flex-start' }}>
      <h2>Screenshots are off for this person</h2>
      <p className="muted">No screenshots are taken on this person&apos;s computers. Earlier screenshots in the range you pick are below.</p>
      {admin && <Link className="btn pri" href="?tab=settings">Open What is collected</Link>}
      {picker}
      {list}
      {viewer}
    </div>
  );

  return (
    <>
      <div className="notice info"><div>
        {interval ? <b>One screenshot {every(interval)}. </b> : null}
        Screenshots are kept for the company&apos;s retention period{min ? `, so the earliest day you can open is ${longDay(min)}` : ''}. Only Company Admins and this person&apos;s manager can see them.
      </div></div>
      {note && <div className="notice warn" role="alert">{note}</div>}
      <div className="card stack">
        <div className="cardhead"><h2>{rangeLabel(feed.from, feed.to)}</h2>{picker}</div>
        {list}
      </div>
      {viewer}
    </>
  );
}

/** Newest first; a heading per company day when the range spans days. */
function Days({ items, tz, multi, onOpen, onBroken }: { items: Shot[]; tz: string; multi: boolean; onOpen: (id: string) => void; onBroken: () => void }) {
  if (!multi) return <Grid items={items} tz={tz} onOpen={onOpen} onBroken={onBroken} />;
  const groups: [string, Shot[]][] = [];
  for (const s of items) {
    const k = dayKey(new Date(s.captured_at), tz);
    if (groups.at(-1)?.[0] === k) groups.at(-1)![1].push(s); else groups.push([k, [s]]);
  }
  return <>{groups.map(([k, xs]) => (
    <section key={k} className="stack" aria-label={longDay(k)}>
      <h3>{longDay(k)}</h3>
      <Grid items={xs} tz={tz} onOpen={onOpen} onBroken={onBroken} />
    </section>
  ))}</>;
}

function Grid({ items, tz, onOpen, onBroken }: { items: Shot[]; tz: string; onOpen: (id: string) => void; onBroken: () => void }) {
  return (
    <div className="shots">
      {items.map((s) => (
        <button key={s.id} className="shot" style={{ padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => onOpen(s.id)}
          aria-label={`Screenshot at ${clock(s.captured_at, tz)} on ${s.hostname}`}>
          <div className="scr" style={{ padding: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed link must not pass through the image optimizer */}
            <img src={s.thumb_url ?? s.view_url} alt="" referrerPolicy="no-referrer" loading="lazy" onError={onBroken} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="meta"><span>{clock(s.captured_at, tz)}</span><span className="mono">{s.hostname}</span></div>
        </button>
      ))}
    </div>
  );
}

function Viewer({ feed, id, setId, tz, refresh, more }: {
  feed: Feed; id: string | null; setId: (id: string | null) => void; tz: string; refresh: () => Promise<void>; more: () => Promise<Feed | null>;
}) {
  const items = feed.items;
  const i = items.findIndex((s) => s.id === id), s = items[i];
  const [saving, setSaving] = useState(false);
  const [stepping, setStepping] = useState(false);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const atEnd = i === items.length - 1 && !feed.cursor;
  // Next past the loaded items loads the next page; stepping onto an expired link refetches first (fresh links, same ids).
  const step = async (n: number) => {
    setStepping(true);
    let list = items;
    if (n > 0 && !list[i + n] && feed.cursor) list = (await more())?.items ?? list;
    const next = list[i + n];
    if (next) { if (expired(next)) await refresh(); setId(next.id); }
    setStepping(false);
  };
  return (
    <Modal title={s ? `${clock(s.captured_at, tz)} · ${s.hostname}` : 'Screenshot'} open={!!id} onClose={() => setId(null)} wide>
      {!s ? <p className="muted">This screenshot is no longer available.</p> : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed link must not pass through the image optimizer */}
          <img src={s.view_url} alt={`Screenshot at ${clock(s.captured_at, tz)} on ${s.hostname}`} referrerPolicy="no-referrer"
            onError={() => refresh()} style={{ width: '100%', borderRadius: 8, background: 'var(--surface-2)' }} />
          <div className="row between small"><span title={full(s.captured_at, tz)}><span className="mono">{s.hostname}</span> · {full(s.captured_at, tz)}</span></div>
          <div className="mf">
            <button className="btn" disabled={i === 0 || stepping} onClick={() => step(-1)}>‹ Previous</button>
            <span className="small muted" style={{ alignSelf: 'center' }}>{i + 1} of {feed.total}</span>
            <button className="btn" disabled={atEnd || stepping} onClick={() => step(1)}>{stepping ? 'Loading…' : 'Next ›'}</button>
            <button className="btn pri" disabled={saving} onClick={async () => {
              setSaving(true);
              if (expired(s)) await refresh(); // the list comes back with fresh links for the same screenshot
              save(itemsRef.current.find((x) => x.id === s.id) ?? s);
              setSaving(false);
            }}>{saving ? 'Downloading…' : 'Download'}</button>
          </div>
        </>
      )}
    </Modal>
  );
}
