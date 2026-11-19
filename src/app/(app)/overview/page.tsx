'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useMe } from '@/lib/me';
import { Loaded, PageHead, useData, useRefresh } from '@/lib/use-data';
import { hm } from '@/lib/format';
import { SetupChecklist, RolloutCard } from '@/components/deploy';
import { AlertTable, ap, clock, presetRange, RangePicker, rangeLabel, SplitBar, SplitLegend, type Alert, type Range } from '@/components/reports/kit';

type Dash = {
  devices: { online: number; offline: number; tamper: number };
  today?: { tracked_seconds: number; activity_percent: number | null };
  alerts?: Alert[];
  seats?: { used: number; limit: number | null };
};
type Prod = { from: string; to: string; productive_seconds: number; neutral_seconds: number; unproductive_seconds: number; tracked_seconds: number };

export default function Overview() {
  const me = useMe();
  // No polling (A5): loads on open and on Refresh; `tick` reloads the other cards too.
  const dash = useData<Dash>('/v1/dashboard');
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [loadedAt, setLoadedAt] = useState<string | null>(null);
  useEffect(() => { if (dash.data) setLoadedAt(new Date().toISOString()); }, [dash.data]);
  async function refresh() { setBusy(true); setTick((t) => t + 1); await dash.reload(); setBusy(false); }
  const reader = me.role === 'company_admin' || me.role === 'manager';
  const it = me.role === 'it_admin';
  const sub = it ? 'Device health and rollout status. Activity reports are not available to IT Admins.'
    : me.role === 'manager' ? 'Your team' : me.company?.name;

  return (
    <>
      <PageHead title="Overview" sub={sub} right={
        <div className="row">
          {loadedAt && <span className="small muted" role="status">Updated {clock(loadedAt, me.tz)}</span>}
          <button className="btn sm" onClick={refresh} disabled={busy}>{busy ? 'Refreshing…' : 'Refresh'}</button>
        </div>
      } />
      {(me.role === 'company_admin' || it) && <SetupChecklist refresh={tick} />}
      <Loaded s={dash} rows={4}>{(d) => (
        <>
          <div className="grid g4">
            <Stat k="online" title="Online now" v={d.devices.online} sub={`of ${d.devices.online + d.devices.offline + d.devices.tamper} computers`} link={me.role !== 'manager'} />
            <Stat k="offline" title="Offline" v={d.devices.offline} sub="not heard from in 15 minutes" link={me.role !== 'manager'} />
            <Stat k="tamper" title="Tamper" v={d.devices.tamper} sub="needs review" link={me.role !== 'manager'} bad />
            {d.seats && <div className="card stat"><span className="label">Seats used</span><span className="v">{d.seats.used}</span><span className="s">{d.seats.limit == null ? 'of unlimited' : `of ${d.seats.limit}`}</span></div>}
            {d.today && (
              <div className="card stat"><span className="label">Tracked today</span><span className="v">{hm(d.today.tracked_seconds)}</span><span className="s">{ap(d.today.activity_percent)} activity</span></div>
            )}
          </div>
          <div className="grid g-wide">
            {reader ? <SplitCard tz={me.tz} admin={me.role === 'company_admin'} refresh={tick} /> : <RolloutCard compact refresh={tick} />}
            {d.alerts && (
              <div className="card">
                <div className="cardhead"><h2>Recent alerts</h2><Link href="/alerts" className="small">View all</Link></div>
                <AlertTable items={d.alerts.slice(0, 5)} tz={me.tz} empty="No alerts." linkPeople={reader} />
              </div>
            )}
          </div>
          {me.role === 'company_admin' && <RolloutCard refresh={tick} />}
        </>
      )}</Loaded>
    </>
  );
}

function Stat({ k, title, v, sub, link, bad }: { k: string; title: string; v: number; sub: string; link: boolean; bad?: boolean }) {
  const body = <><span className="label">{title}</span><span className="v" style={bad && v ? { color: 'var(--bad)' } : undefined}>{v}</span><span className="s">{sub}</span></>;
  return link ? <Link href={`/devices?status=${k}`} className="card stat" style={{ color: 'inherit', textDecoration: 'none' }}>{body}</Link> : <div className="card stat">{body}</div>;
}

function SplitCard({ tz, admin, refresh }: { tz: string; admin: boolean; refresh: number }) {
  const [range, setRange] = useState<Range>(() => presetRange('today', tz));
  const [dept, setDept] = useState('');
  const emps = useData<{ department: string | null }[]>(admin ? '/v1/employees' : null);
  const depts = [...new Set((emps.data ?? []).map((e) => e.department).filter((x): x is string => !!x))].sort();
  const prod = useData<Prod>(`/v1/reports/productivity?from=${range.from}&to=${range.to}${dept ? `&department=${encodeURIComponent(dept)}` : ''}`);
  useRefresh(refresh, prod.reload);
  return (
    <div className="card stack">
      <div className="cardhead">
        <h2>Productivity split</h2>
        {prod.data && <span className="muted small">{hm(prod.data.tracked_seconds)} tracked</span>}
      </div>
      <div className="toolbar">
        <RangePicker value={range} onChange={setRange} tz={tz} />
        {admin && (
          <select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)} style={{ width: 'auto' }}>
            <option value="">All departments</option>
            {depts.map((d) => <option key={d}>{d}</option>)}
          </select>
        )}
      </div>
      <Loaded s={prod} rows={2}>{(p) => (
        <>
          <p className="small muted">{rangeLabel(p.from, p.to)}</p>
          {p.tracked_seconds ? <><SplitBar s={p} /><SplitLegend s={p} /></> : <p className="muted">No tracked time in this range yet. Time shows here once computers with WorkBeat report activity.</p>}
        </>
      )}</Loaded>
    </div>
  );
}
