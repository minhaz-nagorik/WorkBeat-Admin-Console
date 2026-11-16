'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData, Loaded, type DataState } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { hm } from '@/lib/format';
import { label, options } from '@/lib/labels';
import type { TabProps } from './tabs';
import {
  addDays, ap, daysIn, download, fmtDay, HourChart, longDay, presetRange, RangePicker, rangeLabel, useRetainedFrom, type Range,
} from '@/components/reports/kit';

type Period = { period_start: string; tracked_seconds: number; activity_percent: number | null; productive_seconds: number; neutral_seconds: number; unproductive_seconds: number };
type Activity = { from: string; to: string; tracked_seconds: number; activity_percent: number | null; idle_seconds: number; hours: { hour: number; tracked_seconds: number; activity_percent: number | null }[]; periods?: Period[] };
type Prod = { from: string; to: string; productive_seconds: number; neutral_seconds: number; unproductive_seconds: number; tracked_seconds: number; periods?: Period[] };
type Item = { seconds: number; category: string };
type Group = 'day' | 'week' | 'month';

type Prefs = { show: Record<'summary' | 'hourly' | 'breakdown' | 'apps' | 'sites', boolean>; top: string; cat: string };
const DEFAULT: Prefs = { show: { summary: true, hourly: true, breakdown: true, apps: true, sites: true }, top: '8', cat: 'all' };
const SECTIONS: [keyof Prefs['show'], string][] = [['summary', 'Summary cards'], ['hourly', 'Activity by hour'], ['breakdown', 'Breakdown table'], ['apps', 'Applications'], ['sites', 'Websites']];
const CATCOL: Record<string, string> = { productive: 'var(--prod)', neutral: 'var(--neu)', unproductive: 'var(--unprod)' };

/** Customize choices, kept per reader in this browser only (employee-report). */
function usePrefs(userId: string) {
  const k = `wb.report.${userId}`;
  const [p, setP] = useState<Prefs>(DEFAULT);
  useEffect(() => { try { const s = localStorage.getItem(k); if (s) setP({ ...DEFAULT, ...JSON.parse(s) }); } catch { /* storage blocked: defaults */ } }, [k]);
  const save = (n: Prefs) => { setP(n); try { localStorage.setItem(k, JSON.stringify(n)); } catch { /* ignore */ } };
  return [p, save] as const;
}

export function EmployeeActivity({ employeeId, tz }: TabProps) {
  const me = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const [range, setRange] = useState<Range>(() => sp.get('from') && sp.get('to')
    ? { preset: 'custom', from: sp.get('from')!, to: sp.get('to')! } : presetRange('last7', tz));
  const [compare, setCompare] = useState(false);
  const [group, setGroup] = useState<Group>('day');
  const [cust, setCust] = useState(false);
  const [prefs, setPrefs] = usePrefs(me.id);
  const [note, setNote] = useState<string | null>(null);
  const min = useRetainedFrom(tz, employeeId);

  const q = `from=${range.from}&to=${range.to}&employee_id=${employeeId}`;
  const n = daysIn(range.from, range.to);
  const pq = `from=${addDays(range.from, -n)}&to=${addDays(range.from, -1)}&employee_id=${employeeId}`;
  const limit = prefs.top === 'all' || prefs.cat !== 'all' ? 100 : +prefs.top; // category filter runs here, so ask for the most
  const act = useData<Activity>(`/v1/reports/activity?${q}&group_by=${group}`);
  const prod = useData<Prod>(`/v1/reports/productivity?${q}&group_by=${group}`);
  const apps = useData<{ apps: (Item & { app_name: string })[] }>(`/v1/reports/apps?${q}&limit=${limit}`);
  const sites = useData<{ websites: (Item & { domain: string })[] }>(`/v1/reports/websites?${q}&limit=${limit}`);
  const pAct = useData<Activity>(compare ? `/v1/reports/activity?${pq}` : null);
  const pProd = useData<Prod>(compare ? `/v1/reports/productivity?${pq}` : null);

  const pick = <T extends Item>(xs: T[]) => {
    const f = prefs.cat === 'all' ? xs : xs.filter((x) => x.category === prefs.cat);
    return prefs.top === 'all' ? f : f.slice(0, +prefs.top);
  };
  async function exp(kind: string) {
    setNote(null);
    setNote(await download(`/v1/exports/${kind}.csv?${q}`, `workbeat-${kind}-${range.from}-${range.to}.csv`));
  }
  const delta = (cur: number | null | undefined, old: number | null | undefined) => {
    if (!compare) return null;
    if (!old || cur == null) return <span className="s">no earlier data</span>;
    const d = Math.round(((cur - old) / old) * 100);
    return <span className="s">{d >= 0 ? '▲ up' : '▼ down'} {Math.abs(d)}% vs previous {n === 1 ? 'day' : `${n} days`}</span>;
  };
  const show = prefs.show;

  return (
    <>
      <div className="card toolbar between" style={{ padding: '12px 16px' }}>
        <div className="row">
          <RangePicker value={range} onChange={setRange} tz={tz} min={min} />
          <label className="row" style={{ gap: 6 }}><input type="checkbox" checked={compare} onChange={(e) => setCompare(e.target.checked)} /> Compare with previous period</label>
        </div>
        <div className="row">
          <button className={`btn ${cust ? 'pri' : ''}`} aria-pressed={cust} onClick={() => setCust(!cust)}>Customize</button>
          <details style={{ position: 'relative' }}>
            <summary className="btn">Export CSV</summary>
            <div className="card stack" style={{ position: 'absolute', right: 0, zIndex: 5, minWidth: 220, marginTop: 4 }}>
              <button className="btn" onClick={() => exp('app-sessions')}>App sessions</button>
              <button className="btn" onClick={() => exp('url-visits')}>Website visits</button>
              <button className="btn" onClick={() => exp('daily-summaries')}>Daily summaries</button>
            </div>
          </details>
        </div>
      </div>
      {note && <div className="notice warn" role="alert">{note}</div>}

      {cust && (
        <div className="card stack">
          <div className="cardhead"><h2>Customize report</h2><button className="btn sm" onClick={() => setPrefs(DEFAULT)}>Reset to default</button></div>
          <div className="checks">{SECTIONS.map(([k, l]) => (
            <label key={k}><input type="checkbox" checked={show[k]} onChange={(e) => setPrefs({ ...prefs, show: { ...show, [k]: e.target.checked } })} /> {l}</label>
          ))}</div>
          <div className="form">
            <div className="field"><label htmlFor="rep-top">Apps and sites to list</label>
              <select id="rep-top" value={prefs.top} onChange={(e) => setPrefs({ ...prefs, top: e.target.value })}>
                {[['5', 'Top 5'], ['8', 'Top 8'], ['15', 'Top 15'], ['all', 'All']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></div>
            <div className="field"><label htmlFor="rep-cat">Category</label>
              <select id="rep-cat" value={prefs.cat} onChange={(e) => setPrefs({ ...prefs, cat: e.target.value })}>
                <option value="all">All categories</option>
                {options('category').map(([v, l]) => <option key={v} value={v}>{l} only</option>)}
              </select></div>
          </div>
          <p className="small muted">These choices are kept in this browser only.</p>
        </div>
      )}

      <Loaded s={act} rows={4}>{(a) => (
        <>
          <p className="small muted">{rangeLabel(a.from, a.to)}</p>
          {a.from !== range.from && <div className="notice info" role="status">Data before {longDay(a.from)} was deleted by the company&apos;s retention setting. The report shows the days that are kept.</div>}
          {!a.tracked_seconds && <div className="card"><h2>No activity in this range</h2><p className="muted" style={{ marginTop: 6 }}>Weekends, paused time and days before the retention limit have no data. Pick another range.</p></div>}

          {show.summary && prod.data && (
            <div className="grid g4">
              <div className="card stat"><span className="label">Tracked time</span><span className="v">{hm(a.tracked_seconds)}</span><span className="s">idle time included</span>{delta(a.tracked_seconds, pAct.data?.tracked_seconds)}</div>
              <div className="card stat"><span className="label">Activity</span><span className="v">{ap(a.activity_percent)}</span><span className="s">time with keyboard or mouse use</span>{delta(a.activity_percent, pAct.data?.activity_percent)}</div>
              <ShareCard title="Productive" s={prod.data.productive_seconds} t={prod.data.tracked_seconds} color="var(--prod)" d={delta(prod.data.productive_seconds, pProd.data?.productive_seconds)} />
              <ShareCard title="Unproductive" s={prod.data.unproductive_seconds} t={prod.data.tracked_seconds} color="var(--unprod)" d={delta(prod.data.unproductive_seconds, pProd.data?.unproductive_seconds)} />
            </div>
          )}

          {show.hourly && (
            <div className="card">
              <div className="cardhead"><h2>Activity by hour</h2>{n > 1 && <span className="small muted">Average over the days with data</span>}</div>
              <HourChart hours={a.hours} />
              <p className="small muted" style={{ marginTop: 8 }}>Each bar is one hour. Its full height is how many minutes the computer was on; the dark part is how many of those minutes the keyboard or mouse was used. What was typed is never recorded.</p>
            </div>
          )}

          {(show.apps || show.sites) && (
            <div className={`grid ${show.apps && show.sites ? 'g2' : ''}`}>
              {show.apps && <div className="card"><h2>Applications</h2><Bars s={apps} rows={(d) => pick(d.apps).map((x) => ({ name: x.app_name, ...x }))} /></div>}
              {show.sites && <div className="card"><h2>Websites</h2><Bars mono s={sites} rows={(d) => pick(d.websites).map((x) => ({ name: x.domain, ...x }))} />
                <p className="small muted" style={{ marginTop: 10 }}>Sites on the company&apos;s private list are not logged.</p></div>}
            </div>
          )}

          {show.breakdown && (
            <div className="card">
              <div className="cardhead"><h2>Breakdown by {label('period', group).toLowerCase()}</h2>
                <select aria-label="Breakdown by" style={{ width: 'auto' }} value={group} onChange={(e) => setGroup(e.target.value as Group)}>
                  {options('period').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select></div>
              <div className="tablewrap"><table>
                <thead><tr><th>{label('period', group)}</th><th>Tracked</th><th>Activity</th><th>Productive</th><th>Neutral</th><th>Unproductive</th></tr></thead>
                <tbody>{(a.periods ?? []).map((p) => {
                  const pr = prod.data?.periods?.find((x) => x.period_start === p.period_start) ?? p;
                  const lbl = group === 'day' ? fmtDay(p.period_start) : group === 'week' ? `Week of ${fmtDay(p.period_start, { day: 'numeric', month: 'short' })}` : fmtDay(p.period_start, { month: 'long', year: 'numeric' });
                  const open = () => router.replace(`?tab=calendar&view=day&date=${p.period_start}`, { scroll: false });
                  return (
                    <tr key={p.period_start}>
                      <td>{group === 'day' ? <button className="linkbtn" onClick={open} title="Open this day in the calendar">{lbl}</button> : lbl}</td>
                      <td className="num">{hm(p.tracked_seconds)}</td><td className="num">{ap(p.activity_percent)}</td>
                      <td className="num">{hm(pr.productive_seconds)}</td><td className="num">{hm(pr.neutral_seconds)}</td><td className="num">{hm(pr.unproductive_seconds)}</td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
            </div>
          )}
        </>
      )}</Loaded>
    </>
  );
}

function ShareCard({ title, s, t, color, d }: { title: string; s: number; t: number; color: string; d: React.ReactNode }) {
  return <div className="card stat"><span className="label">{title}</span><span className="v" style={{ color }}>{t ? `${Math.round((s / t) * 100)}%` : '—'}</span><span className="s">{hm(s)}</span>{d}</div>;
}

function Bars<T>({ s, rows, mono }: { s: DataState<T>; rows: (d: T) => { name: string; seconds: number; category: string }[]; mono?: boolean }) {
  return (
    <Loaded s={s} rows={3}>{(d) => {
      const r = rows(d), max = r[0]?.seconds || 1;
      if (!r.length) return <p className="small muted">Nothing recorded in this range.</p>;
      return (
        <ul className="stack" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {r.map((x) => (
            <li key={x.name} className="hbar">
              <span className={`row ${mono ? 'mono' : ''}`} style={{ gap: 6, flexWrap: 'nowrap', minWidth: 0 }}>
                <span className="dot" style={{ background: CATCOL[x.category] }} aria-hidden="true" />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={x.name}>{x.name}</span>
                <span className="small muted" style={{ flexShrink: 0 }}>{label('category', x.category)}</span>
              </span>
              <span className="t" aria-hidden="true"><i style={{ width: `${(x.seconds / max) * 100}%`, background: CATCOL[x.category] }} /></span>
              <span className="n">{hm(x.seconds)}</span>
            </li>
          ))}
        </ul>
      );
    }}</Loaded>
  );
}
