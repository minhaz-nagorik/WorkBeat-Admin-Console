'use client';
import Link from 'next/link';
import { useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useData, Loaded } from '@/lib/use-data';
import { Modal } from '@/components/confirm';
import { full } from '@/lib/time';
import type { TabProps } from './tabs';
import { addDays, clock, fmtDay, longDay, today, useRetainedFrom } from '@/components/reports/kit';

// view_url is a 5-minute signed link (A6, rule 4): it lives only in this component's memory and in <img src>,
// never in storage, logs or our address. An expired link or a failed image refetches the day's list.
type Shot = { id: string; captured_at: string; device_id: string; hostname: string; view_url: string; expires_at: string };
type Day = { screenshots_enabled: boolean; items: Shot[] };

const every = (s: number) => (s % 3600 === 0 ? (s === 3600 ? 'every hour' : `every ${s / 3600} hours`) : `every ${Math.round(s / 60)} minutes`);
const expired = (s: Shot) => new Date(s.expires_at).getTime() - Date.now() < 5_000;

export function EmployeeScreenshots({ employeeId, tz, role }: TabProps) {
  const sp = useSearchParams();
  const t = today(tz);
  const [date, setDate] = useState(() => sp.get('date') ?? t);
  const [open, setOpen] = useState<string | null>(null); // screenshot id, never its link
  const min = useRetainedFrom(tz, employeeId);
  const day = useData<Day>(`/v1/employees/${employeeId}/screenshots?date=${date}`);
  const settings = useData<{ screenshot_interval_seconds: number }>(`/v1/employees/${employeeId}/monitoring-settings`);
  const last = useRef(0);
  const admin = role === 'company_admin';

  // Refetch for fresh links, at most every 10 s so a broken image can't loop.
  const refresh = async () => { if (Date.now() - last.current < 10_000) return; last.current = Date.now(); await day.reload(); };
  const pick = (d: string) => { if (d && d <= t && (!min || d >= min)) { setDate(d); setOpen(null); } };

  if (day.status === 404) return <div className="card"><p>This employee isn&apos;t on your team or no longer exists.</p></div>;
  const interval = settings.data?.screenshot_interval_seconds;

  return (
    <Loaded s={day} rows={4}>{(d) => {
      if (!d.screenshots_enabled) return (
        <div className="card stack" style={{ alignItems: 'flex-start' }}>
          <h2>Screenshots are off</h2>
          <p className="muted">Your company&apos;s plan doesn&apos;t include screenshots.</p>
          {admin && <Link className="btn pri" href="/company-settings#billing">Open billing</Link>}
        </div>
      );
      if (interval === 0) return (
        <div className="card stack" style={{ alignItems: 'flex-start' }}>
          <h2>Screenshots are off for this person</h2>
          <p className="muted">No screenshots are taken on this person&apos;s computers.{d.items.length ? ' Earlier screenshots of this day are below.' : ''}</p>
          {admin && <Link className="btn pri" href="?tab=settings">Open What is collected</Link>}
          {d.items.length > 0 && <Grid items={d.items} tz={tz} onOpen={setOpen} onBroken={refresh} />}
          <Viewer items={d.items} id={open} setId={setOpen} tz={tz} refresh={refresh} />
        </div>
      );
      return (
        <>
          <div className="notice info"><div>
            {interval ? <b>One screenshot {every(interval)}. </b> : null}
            Screenshots are kept for the company&apos;s retention period{min ? `, so the earliest day you can open is ${longDay(min)}` : ''}. Only Company Admins and this person&apos;s manager can see them.
          </div></div>
          <div className="card stack">
            <div className="cardhead">
              <h2>{longDay(date)}</h2>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn sm" disabled={!!min && date <= min} onClick={() => pick(addDays(date, -1))} aria-label="Previous day">‹</button>
                <input type="date" aria-label="Screenshot date" value={date} min={min} max={t} onChange={(e) => pick(e.target.value)} />
                <button className="btn sm" disabled={date >= t} onClick={() => pick(addDays(date, 1))} aria-label="Next day">›</button>
                <button className="btn sm" disabled={date === t} onClick={() => pick(t)}>Today</button>
              </div>
            </div>
            {d.items.length ? (
              <><p className="small muted">{d.items.length} {d.items.length === 1 ? 'screenshot' : 'screenshots'} this day</p><Grid items={d.items} tz={tz} onOpen={setOpen} onBroken={refresh} /></>
            ) : <p className="muted">No screenshots were taken on {fmtDay(date, { weekday: 'long', day: 'numeric', month: 'long' })}.</p>}
          </div>
          <Viewer items={d.items} id={open} setId={setOpen} tz={tz} refresh={refresh} />
        </>
      );
    }}</Loaded>
  );
}

function Grid({ items, tz, onOpen, onBroken }: { items: Shot[]; tz: string; onOpen: (id: string) => void; onBroken: () => void }) {
  return (
    <div className="shots">
      {items.map((s) => (
        <button key={s.id} className="shot" style={{ padding: 0, cursor: 'pointer', textAlign: 'left' }} onClick={() => onOpen(s.id)}
          aria-label={`Screenshot at ${clock(s.captured_at, tz)} on ${s.hostname}`}>
          <div className="scr" style={{ padding: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- signed link must not pass through the image optimizer */}
            <img src={s.view_url} alt="" referrerPolicy="no-referrer" loading="lazy" onError={onBroken} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div className="meta"><span>{clock(s.captured_at, tz)}</span><span className="mono">{s.hostname}</span></div>
        </button>
      ))}
    </div>
  );
}

function Viewer({ items, id, setId, tz, refresh }: { items: Shot[]; id: string | null; setId: (id: string | null) => void; tz: string; refresh: () => Promise<void> }) {
  const i = items.findIndex((s) => s.id === id), s = items[i];
  // Stepping onto an expired link refetches first; the new list carries fresh links for the same ids.
  const step = async (n: number) => { const next = items[i + n]; if (!next) return; if (expired(next)) await refresh(); setId(next.id); };
  return (
    <Modal title={s ? `${clock(s.captured_at, tz)} · ${s.hostname}` : 'Screenshot'} open={!!id} onClose={() => setId(null)} wide>
      {!s ? <p className="muted">This screenshot is no longer available.</p> : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element -- signed link must not pass through the image optimizer */}
          <img src={s.view_url} alt={`Screenshot at ${clock(s.captured_at, tz)} on ${s.hostname}`} referrerPolicy="no-referrer"
            onError={() => refresh()} style={{ width: '100%', borderRadius: 8, background: 'var(--surface-2)' }} />
          <div className="row between small"><span title={full(s.captured_at, tz)}><span className="mono">{s.hostname}</span> · {full(s.captured_at, tz)}</span></div>
          <div className="mf">
            <button className="btn" disabled={i === 0} onClick={() => step(-1)}>‹ Previous</button>
            <span className="small muted" style={{ alignSelf: 'center' }}>{i + 1} of {items.length}</span>
            <button className="btn" disabled={i === items.length - 1} onClick={() => step(1)}>Next ›</button>
            <button className="btn pri" onClick={async () => { if (expired(s)) await refresh(); else window.open(s.view_url, '_blank', 'noopener,noreferrer'); }}>Download</button>
          </div>
        </>
      )}
    </Modal>
  );
}
