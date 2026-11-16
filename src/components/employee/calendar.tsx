'use client';
import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useData, Loaded } from '@/lib/use-data';
import { hm } from '@/lib/format';
import { label, options } from '@/lib/labels';
import type { TabProps } from './tabs';
import {
  addDays, addMonths, ap, clock, download, fmtDay, HourChart, longDay, mondayOf, monthStart, saveBlob, SplitBar, today, toCsv, useRetainedFrom,
} from '@/components/reports/kit';

type Day = { date: string; tracked_seconds: number; activity_percent: number | null; productive_seconds: number; neutral_seconds: number; unproductive_seconds: number; paused: boolean };
type View = 'day' | 'week' | 'month';
const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function EmployeeCalendar({ employeeId, tz }: TabProps) {
  const sp = useSearchParams();
  const router = useRouter();
  const t = today(tz);
  const [view, setView] = useState<View>(() => (['day', 'week', 'month'] as View[]).find((v) => v === sp.get('view')) ?? 'month');
  const [date, setDate] = useState(() => sp.get('date') ?? t);
  const min = useRetainedFrom(tz, employeeId);
  const cal = useData<Day[]>(`/v1/employees/${employeeId}/calendar?view=${view}&date=${date}`);

  // Period bounds: previous is off once the whole previous period is before retention, next once it starts after today.
  const [start, end] = view === 'month' ? [monthStart(date), addDays(addMonths(date, 1), -1)] : view === 'week' ? [mondayOf(date), addDays(mondayOf(date), 6)] : [date, date];
  const step = (n: number) => setDate(view === 'month' ? addMonths(date, n) : addDays(date, n * (view === 'week' ? 7 : 1)));
  const prevOk = !min || addDays(start, -1) >= min;
  const nextOk = addDays(end, 1) <= t;
  const title = view === 'month' ? fmtDay(start, { month: 'long', year: 'numeric' }) : view === 'week' ? `Week of ${fmtDay(start, { day: 'numeric', month: 'long', year: 'numeric' })}` : longDay(date);
  const openDay = (k: string) => { setView('day'); setDate(k); };
  const go = (q: string) => router.replace(`?${q}`, { scroll: false });

  return (
    <div className="card stack">
      <div className="cardhead">
        <div className="row">
          <button className="btn sm" disabled={!prevOk} onClick={() => step(-1)} aria-label={`Previous ${view}`}>‹</button>
          <h2>{title}</h2>
          <button className="btn sm" disabled={!nextOk} onClick={() => step(1)} aria-label={`Next ${view}`}>›</button>
          <button className="btn sm" onClick={() => setDate(t)}>Today</button>
        </div>
        <div className="seg" role="group" aria-label="Calendar view">
          {options('period').map(([v, l]) => <button key={v} className={view === v ? 'on' : ''} aria-pressed={view === v} onClick={() => setView(v as View)}>{l}</button>)}
        </div>
      </div>
      <Loaded s={cal} rows={4}>{(rows) => {
        const by = new Map(rows.map((r) => [r.date, r]));
        const cell = (k: string) => ({ r: by.get(k), future: k > t, gone: k <= t && !by.has(k) });
        if (view === 'month') {
          const lead = (new Date(`${start}T00:00:00Z`).getUTCDay() + 6) % 7;
          const days = Array.from({ length: +end.slice(8) }, (_, i) => addDays(start, i));
          return (
            <>
              <div className="cal">
                {DOW.map((d) => <div key={d} className="dh">{d}</div>)}
                {Array.from({ length: lead }, (_, i) => <div key={`l${i}`} className="d out" />)}
                {days.map((k) => {
                  const { r, future, gone } = cell(k), n = +k.slice(8);
                  if (future || gone) return <div key={k} className={`d ${gone ? 'gone' : ''}`}><span className="n1">{n}</span>{gone && <span className="small muted">Deleted</span>}</div>;
                  const lvl = Math.min(1, r!.tracked_seconds / 32400);
                  return (
                    <button key={k} className={`d ${k === t ? 'today' : ''}`} onClick={() => openDay(k)}
                      aria-label={`${longDay(k)}, ${hm(r!.tracked_seconds)} tracked${r!.paused ? ', paused' : ''}`}
                      style={r!.tracked_seconds ? { background: `color-mix(in srgb, var(--accent) ${Math.round(lvl * 38)}%, var(--surface-2))` } : undefined}>
                      <span className="n1">{n}</span>
                      {r!.tracked_seconds > 0 && <><span className="h">{hm(r!.tracked_seconds)}</span><span className="small muted">{ap(r!.activity_percent)} active</span></>}
                      {r!.paused && <span className="pill p-info" style={{ fontSize: 10.5, padding: '0 6px' }}>Paused</span>}
                    </button>
                  );
                })}
              </div>
              <p className="small muted">Darker days have more tracked time. Click a day to open it.</p>
            </>
          );
        }
        if (view === 'week') return (
          <div className="week">
            {Array.from({ length: 7 }, (_, i) => addDays(start, i)).map((k) => {
              const { r, future, gone } = cell(k);
              const body = (
                <>
                  <b>{fmtDay(k)}</b>
                  {future ? <span className="muted">Not yet</span> : gone ? <span className="muted">Deleted</span> : r!.tracked_seconds ? (
                    <><span style={{ fontSize: 15, fontWeight: 600 }}>{hm(r!.tracked_seconds)}</span><span className="muted">{ap(r!.activity_percent)} active</span><SplitBar s={r!} /></>
                  ) : <span className="muted">{r!.paused ? 'Monitoring paused' : 'No activity'}</span>}
                  {r?.paused && r.tracked_seconds > 0 && <span className="pill p-info">Partly paused</span>}
                </>
              );
              return future || gone ? <div key={k} className="wd">{body}</div> : <button key={k} className={`wd ${k === t ? 'today' : ''}`} onClick={() => openDay(k)}>{body}</button>;
            })}
          </div>
        );
        const { r, gone } = cell(date);
        return (
          <>
            {gone ? <p className="muted">This day was deleted by the retention setting.</p> : !r ? <p className="muted">This day hasn&apos;t happened yet.</p> : (
              <>
                <p><b>{hm(r.tracked_seconds)}</b> tracked, <b>{ap(r.activity_percent)}</b> active{r.paused && <> · <span className="pill p-info">Paused</span> monitoring was paused for part or all of this day</>}</p>
                {r.tracked_seconds > 0 && <DayDetail employeeId={employeeId} date={date} />}
              </>
            )}
            <div className="row">
              <button className="btn" onClick={() => go(`tab=report&from=${date}&to=${date}`)}>Open in report</button>
              <button className="btn" onClick={() => go(`tab=screenshots&date=${date}`)}>Screenshots for this day</button>
            </div>
          </>
        );
      }}</Loaded>
    </div>
  );
}

function DayDetail({ employeeId, date }: { employeeId: string; date: string }) {
  const q = `from=${date}&to=${date}&employee_id=${employeeId}`;
  const act = useData<{ hours: { hour: number; tracked_seconds: number; activity_percent: number | null }[] }>(`/v1/reports/activity?${q}`);
  const apps = useData<{ apps: { app_name: string; seconds: number; category: string }[] }>(`/v1/reports/apps?${q}&limit=5`);
  return (
    <div className="grid g2">
      <div className="stack"><h3>Hours</h3><Loaded s={act}>{(a) => <HourChart hours={a.hours} />}</Loaded></div>
      <div className="stack"><h3>Top apps</h3><Loaded s={apps}>{(d) => d.apps.length ? (
        <>{d.apps.map((x) => (
          <div key={x.app_name} className="row between small">
            <span className="row" style={{ gap: 6 }}><span className="dot" aria-hidden="true" style={{ background: `var(--${x.category === 'productive' ? 'prod' : x.category === 'unproductive' ? 'unprod' : 'neu'})` }} />{x.app_name} <span className="muted">{label('category', x.category)}</span></span>
            <span className="num muted">{hm(x.seconds)}</span>
          </div>
        ))}</>
      ) : <p className="small muted">No apps recorded.</p>}</Loaded></div>
    </div>
  );
}

type TsDay = Day & { first_activity_at: string | null; last_activity_at: string | null };
type Timesheet = { employee: { name: string; email: string | null }; company: { name: string }; week: string; days: TsDay[]; totals: Omit<Day, 'date' | 'paused'> };

export function EmployeeTimesheet({ employeeId, tz }: TabProps) {
  const t = today(tz), thisWeek = mondayOf(t);
  const [week, setWeek] = useState(thisWeek);
  const [note, setNote] = useState<string | null>(null);
  const min = useRetainedFrom(tz, employeeId);
  const ts = useData<Timesheet>(`/v1/employees/${employeeId}/timesheet?week=${week}`);
  const prevOk = !min || addDays(week, -1) >= min; // previous week's Sunday still retained
  const nextOk = addDays(week, 7) <= t;

  function csv(d: Timesheet) {
    const rows: (string | number)[][] = [
      ['Employee', d.employee.name], ['Email', d.employee.email ?? ''], ['Company', d.company.name], ['Week starting', d.week], [],
      ['Date', 'First activity', 'Last activity', 'Tracked (h)', 'Activity %', 'Productive (h)', 'Neutral (h)', 'Unproductive (h)', 'Note'],
      ...d.days.map((r) => [r.date, clock(r.first_activity_at, tz), clock(r.last_activity_at, tz), h(r.tracked_seconds), r.activity_percent == null ? '' : Math.round(r.activity_percent),
        h(r.productive_seconds), h(r.neutral_seconds), h(r.unproductive_seconds), r.paused ? 'Paused' : '']),
      ['Total', '', '', h(d.totals.tracked_seconds), d.totals.activity_percent == null ? '' : Math.round(d.totals.activity_percent), h(d.totals.productive_seconds), h(d.totals.neutral_seconds), h(d.totals.unproductive_seconds), ''],
    ];
    saveBlob(new Blob([toCsv(rows)], { type: 'text/csv' }), `timesheet-${d.employee.name.replace(/[^\w]+/g, '-').toLowerCase()}-${d.week}.csv`);
  }
  async function pdf() {
    setNote(null);
    setNote(await download(`/v1/employees/${employeeId}/timesheet.pdf?week=${week}`, `timesheet-${week}.pdf`));
  }

  return (
    <Loaded s={ts} rows={7}>{(d) => (
      <div className="card stack">
        <div className="cardhead">
          <div><h2>Weekly timesheet · {d.employee.name}</h2><p className="small muted">Week starting Monday {fmtDay(d.week, { day: 'numeric', month: 'long', year: 'numeric' })} · {d.company.name}</p></div>
          <div className="row">
            <button className="btn" disabled={!prevOk} onClick={() => setWeek(addDays(week, -7))} aria-label="Previous week">←</button>
            <button className="btn" disabled={!nextOk} onClick={() => setWeek(addDays(week, 7))} aria-label="Next week">→</button>
            <button className="btn" disabled={week === thisWeek} onClick={() => setWeek(thisWeek)}>This week</button>
            <button className="btn" onClick={() => csv(d)}>Download CSV</button>
            <button className="btn pri" onClick={pdf}>Download PDF</button>
          </div>
        </div>
        {note && <div className="notice warn" role="alert">{note}</div>}
        <div className="tablewrap"><table>
          <thead><tr><th>Day</th><th>First activity</th><th>Last activity</th><th>Tracked</th><th>Activity</th><th>Productive</th><th>Neutral</th><th>Unproductive</th><th>Note</th></tr></thead>
          <tbody>
            {d.days.map((r) => {
              const has = r.tracked_seconds > 0, dash = (v: string) => (has ? v : '—');
              return (
                <tr key={r.date}>
                  <td>{fmtDay(r.date)}</td><td className="num">{clock(r.first_activity_at, tz)}</td><td className="num">{clock(r.last_activity_at, tz)}</td>
                  <td className="num">{dash(hm(r.tracked_seconds))}</td><td className="num">{ap(r.activity_percent)}</td>
                  <td className="num">{dash(hm(r.productive_seconds))}</td><td className="num">{dash(hm(r.neutral_seconds))}</td><td className="num">{dash(hm(r.unproductive_seconds))}</td>
                  <td className="small muted">{r.paused ? 'Paused' : r.date > t ? 'Not yet' : ''}</td>
                </tr>
              );
            })}
            <tr>
              <td><b>Total</b></td><td /><td /><td className="num"><b>{hm(d.totals.tracked_seconds)}</b></td><td className="num">{ap(d.totals.activity_percent)}</td>
              <td className="num"><b>{hm(d.totals.productive_seconds)}</b></td><td className="num">{hm(d.totals.neutral_seconds)}</td><td className="num">{hm(d.totals.unproductive_seconds)}</td><td />
            </tr>
          </tbody>
        </table></div>
        <p className="small muted">Times are in the company&apos;s time zone ({tz}).</p>
      </div>
    )}</Loaded>
  );
}

const h = (s: number) => (s / 3600).toFixed(2);
