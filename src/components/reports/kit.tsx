'use client';
import { toCsv } from '@/lib/csv';
export { toCsv };
import Link from 'next/link';
import { useData } from '@/lib/use-data';
import { hm } from '@/lib/format';
import { label } from '@/lib/labels';
import { dayKey, when, full } from '@/lib/time';

// Company days are YYYY-MM-DD keys (A9). Arithmetic on them runs in UTC so no browser zone leaks in.
const at = (k: string) => new Date(`${k}T00:00:00Z`);
const key = (d: Date) => d.toISOString().slice(0, 10);
export const today = (tz: string) => dayKey(new Date(), tz);
export const addDays = (k: string, n: number) => key(new Date(at(k).getTime() + n * 864e5));
export const mondayOf = (k: string) => addDays(k, -((at(k).getUTCDay() + 6) % 7));
export const monthStart = (k: string) => k.slice(0, 8) + '01';
export const addMonths = (k: string, n: number) => { const d = at(monthStart(k)); d.setUTCMonth(d.getUTCMonth() + n); return key(d); };
export const daysIn = (from: string, to: string) => Math.round((at(to).getTime() - at(from).getTime()) / 864e5) + 1;
/** Format a company day key; the key already is the company day, so format it as UTC. */
export const fmtDay = (k: string, o: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: 'UTC', ...o }).format(at(k));
export const longDay = (k: string) => fmtDay(k, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
/** "09:42" in the company zone. */
export const clock = (iso: string | null, tz: string) => iso
  ? new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso)) : '—';
/** activity_percent arrives as 0–100 or null. */
export const ap = (v: number | null | undefined) => (v == null ? '—' : `${Math.round(v)}%`);
const share = (part: number, total: number) => (total ? `${Math.round((part / total) * 100)}%` : '—');

// ---- range presets (employee-report) ----
export const PRESETS = [['today', 'Today'], ['yesterday', 'Yesterday'], ['thisweek', 'This week'], ['last7', 'Last 7 days'],
  ['thismonth', 'This month'], ['last30', 'Last 30 days'], ['custom', 'Custom range']] as const;
export type Preset = (typeof PRESETS)[number][0];
export type Range = { preset: Preset; from: string; to: string };
export function presetRange(p: Preset, tz: string, cur?: Range): Range {
  const t = today(tz);
  const r: Record<Exclude<Preset, 'custom'>, [string, string]> = {
    today: [t, t], yesterday: [addDays(t, -1), addDays(t, -1)], thisweek: [mondayOf(t), t], last7: [addDays(t, -6), t],
    thismonth: [monthStart(t), t], last30: [addDays(t, -29), t],
  };
  if (p === 'custom') return { preset: p, from: cur?.from ?? t, to: cur?.to ?? t };
  return { preset: p, from: r[p][0], to: r[p][1] };
}

export function RangePicker({ value, onChange, tz, min }: { value: Range; onChange: (r: Range) => void; tz: string; min?: string }) {
  const t = today(tz);
  const set = (from: string, to: string) => { if (from && to) onChange({ preset: 'custom', from: from <= to ? from : to, to: from <= to ? to : from }); };
  return (
    <div className="row rangepick">
      <select aria-label="Date range" value={value.preset} onChange={(e) => onChange(presetRange(e.target.value as Preset, tz, value))}>
        {PRESETS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
      </select>
      <input type="date" aria-label="From date" value={value.from} min={min} max={t} onChange={(e) => set(e.target.value, value.to)} />
      <span className="muted">to</span>
      <input type="date" aria-label="To date" value={value.to} min={min} max={t} onChange={(e) => set(value.from, e.target.value)} />
    </div>
  );
}

export const rangeLabel = (from: string, to: string) => from === to ? fmtDay(from, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
  : `${fmtDay(from, { day: 'numeric', month: 'short' })} – ${fmtDay(to, { day: 'numeric', month: 'short', year: 'numeric' })} · ${daysIn(from, to)} days`;

/**
 * First retained company day for this scope: the reports clamp `from` to it, so a 366-day ask returns it.
 * shortcut: one extra report call per tab, upgrade when the API exposes retention to managers.
 */
export function useRetainedFrom(tz: string, employeeId?: string): string | undefined {
  const t = today(tz);
  const q = `from=${addDays(t, -365)}&to=${t}${employeeId ? `&employee_id=${employeeId}` : ''}`;
  return useData<{ from: string }>(`/v1/reports/productivity?${q}`).data?.from;
}

// ---- charts (accessible: every chart has a text alternative, rule 9) ----
type Split = { productive_seconds: number; neutral_seconds: number; unproductive_seconds: number };
export function SplitBar({ s }: { s: Split }) {
  const tot = s.productive_seconds + s.neutral_seconds + s.unproductive_seconds;
  const w = (v: number) => `${tot ? (v / tot) * 100 : 0}%`;
  return (
    <div className="split" role="img" aria-label={tot ? `Productive ${share(s.productive_seconds, tot)}, neutral ${share(s.neutral_seconds, tot)}, unproductive ${share(s.unproductive_seconds, tot)}` : 'No tracked time'}>
      <span style={{ width: w(s.productive_seconds), background: 'var(--prod)' }} />
      <span style={{ width: w(s.neutral_seconds), background: 'var(--neu)' }} />
      <span style={{ width: w(s.unproductive_seconds), background: 'var(--unprod)' }} />
    </div>
  );
}
export function SplitLegend({ s }: { s: Split }) {
  const tot = s.productive_seconds + s.neutral_seconds + s.unproductive_seconds;
  return (
    <div className="legend">
      <span><i style={{ background: 'var(--prod)' }} />{label('category', 'productive')} {share(s.productive_seconds, tot)}</span>
      <span><i style={{ background: 'var(--neu)' }} />{label('category', 'neutral')} {share(s.neutral_seconds, tot)}</span>
      <span><i style={{ background: 'var(--unprod)' }} />{label('category', 'unproductive')} {share(s.unproductive_seconds, tot)}</span>
    </div>
  );
}

type Hour = { hour: number; tracked_seconds: number; activity_percent: number | null };
const p2 = (n: number) => String(n).padStart(2, '0');
/** Hour-of-day bars on a 0–60 min scale: full bar = tracked minutes, dark part = the active share. */
export function HourChart({ hours }: { hours: Hour[] }) {
  const act = (h: Hour) => h.tracked_seconds * (h.activity_percent ?? 0) / 100;
  const busy = hours.filter((h) => h.tracked_seconds);
  if (!busy.length) return <p className="muted">No activity recorded in this range.</p>;
  const best = busy.reduce((b, h) => (act(h) > act(b) ? h : b));
  return (
    <>
      <div className="hchart">
        <div className="yaxis" aria-hidden="true"><span>60m</span><span>45m</span><span>30m</span><span>15m</span><span>0</span></div>
        <div>
          <div className="bars" style={{ '--n': hours.length } as React.CSSProperties} aria-hidden="true">
            {hours.map((h) => (
              <div key={h.hour} className="b" style={{ height: `${Math.min(100, h.tracked_seconds / 36)}%` }}
                title={`${p2(h.hour)}:00–${p2(h.hour + 1)}:00 · ${hm(h.tracked_seconds)} tracked · ${ap(h.activity_percent)} active`}>
                <i style={{ height: `${h.activity_percent ?? 0}%` }} />
              </div>
            ))}
          </div>
          <div className="bars-x" style={{ '--n': hours.length } as React.CSSProperties} aria-hidden="true">{hours.map((h) => <span key={h.hour}>{p2(h.hour)}:00</span>)}</div>
        </div>
      </div>
      <div className="legend" style={{ marginTop: 8 }}>
        <span><i style={{ background: 'var(--accent)' }} />Active: keyboard or mouse used</span>
        <span><i style={{ background: 'var(--accent-soft)' }} />Computer on, no input (idle)</span>
        <span>Busiest hour: <b>{p2(best.hour)}:00</b>, {hm(act(best))} active</span>
      </div>
      <details className="small">
        <summary>Activity by hour as a table</summary>
        <div className="tablewrap"><table>
          <thead><tr><th>Hour</th><th>Tracked</th><th>Activity</th></tr></thead>
          <tbody>{busy.map((h) => <tr key={h.hour}><td>{p2(h.hour)}:00–{p2(h.hour + 1)}:00</td><td className="num">{hm(h.tracked_seconds)}</td><td className="num">{ap(h.activity_percent)}</td></tr>)}</tbody>
        </table></div>
      </details>
    </>
  );
}

// ---- alerts (same labels and columns as the Alerts page) ----
export type Alert = { id: string; event_type: string; hostname: string; employee: { id: string; name: string } | null; repeat_count: number; occurred_at: string; resolved_at: string | null };
export function AlertTable({ items, tz, empty, linkPeople }: { items: Alert[]; tz: string; empty: string; linkPeople: boolean }) {
  if (!items.length) return <p className="muted small">{empty}</p>;
  return (
    <div className="tablewrap"><table>
      <thead><tr><th>When</th><th>Alert</th><th>Person</th><th>Computer</th></tr></thead>
      <tbody>{items.map((a) => (
        <tr key={a.id}>
          <td className="small" title={full(a.occurred_at, tz)}>{when(a.occurred_at, tz)}</td>
          <td><span className={`pill ${a.event_type === 'offline' ? 'p-warn' : a.event_type === 'permission_revoked' ? 'p-info' : 'p-bad'}`}>{label('alert', a.event_type)}</span>
            {a.repeat_count > 1 && <span className="small muted"> ×{a.repeat_count}</span>}{a.resolved_at && <span className="small muted"> · Resolved</span>}</td>
          <td>{!a.employee ? <span className="muted">—</span> : linkPeople ? <Link href={`/employees/${a.employee.id}`}>{a.employee.name}</Link> : a.employee.name}</td>
          <td className="mono small">{a.hostname}</td>
        </tr>
      ))}</tbody>
    </table></div>
  );
}

// ---- downloads ----
/** Fetch a file through the same-origin proxy and save it under the name the response gives. Returns an error message or null. */
export async function download(path: string, fallback: string): Promise<string | null> {
  let res: Response;
  try { res = await fetch(`/api${path}`); } catch { return 'Something went wrong. Try again.'; }
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    if (res.status === 422 && j?.code === 'EXPORT_TOO_LARGE') return `This export is over the ${j.cap ? Number(j.cap).toLocaleString('en-GB') + '-row' : 'row'} limit. Pick a shorter range.`;
    if (res.status === 404) return 'This file is not available.';
    if (res.status === 403) return "You don't have access to this file.";
    return 'Something went wrong. Try again.';
  }
  const name = /filename="?([^";]+)"?/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? fallback;
  saveBlob(await res.blob(), name);
  return null;
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = name; document.body.append(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
/** CSV with formula-leading cells prefixed by ' and quoting (backend data-export rules). */
