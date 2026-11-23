'use client';
import { can } from '@/lib/nav';
import { isPending, PendingList, SENT } from '@/components/pending';
import { use, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { call, message, usePoll } from '@/lib/client';
import { label, options } from '@/lib/labels';
import { useMe } from '@/lib/me';
import { when, full } from '@/lib/time';
import { useData, PageHead } from '@/lib/use-data';
import { EmailSettings, emailSentence, useAlertRoles, type AlertEmail } from '@/components/alerts/email-settings';

type Alert = {
  id: string; event_type: string; device_id: string; hostname: string; employee: { id: string; name: string } | null;
  detail: Record<string, unknown>; repeat_count: number; occurred_at: string;
  resolved_at: string | null; resolved_by: string | null; resolved_by_name: string | null;
};
type Feed = { items: Alert[]; next_cursor: string | null; counts: Record<string, number> };
type State = 'open' | 'resolved' | 'all';

const TYPES = options('alert');
const HELP: Record<string, string> = {
  process_restart: 'Someone or something shut WorkBeat down. It restarted itself.',
  hosts_modified: 'Another program tried to undo website blocking. WorkBeat put it back.',
  config_changed: 'WorkBeat’s settings on the computer were changed or deleted.',
  clock_tampered: 'The computer’s clock was set back, which can hide when work happened.',
  permission_revoked: 'A Mac permission WorkBeat needs (screen recording or accessibility) was turned off.',
  offline: 'The computer has not connected for more than 15 minutes. Often it is just switched off or has no internet.',
  duplicate_device_id: 'Two installs reported the same computer. One may be a copied or restored computer.',
};
const SEV = (t: string) => (t === 'offline' ? 'p-warn' : t === 'permission_revoked' ? 'p-info' : 'p-bad');

function describe(a: Alert, tz: string) {
  const last = a.detail.last_heartbeat_at;
  const base = a.event_type === 'offline' && typeof last === 'string'
    ? `Not connected since ${when(last, tz)}.` : HELP[a.event_type] ?? 'Something unusual happened on this computer.';
  return a.repeat_count > 1 ? `${base} Happened ${a.repeat_count} times.` : base;
}

/** Query for the feed. A label match becomes `type`, since the API's `q` only knows raw type names. */
function feedQuery(f: { type: string; state: State; q: string; employee?: string; device?: string }) {
  const p = new URLSearchParams();
  const q = f.q.trim();
  const byLabel = q ? TYPES.filter(([, l]) => l.toLowerCase().includes(q.toLowerCase())).map(([k]) => k) : [];
  const types = byLabel.length && f.type === 'all' ? byLabel : byLabel.includes(f.type) ? [f.type] : [];
  if (types.length) p.set('type', types.join(','));
  else {
    if (f.type !== 'all') p.set('type', f.type);
    if (q) p.set('q', q.slice(0, 100));
  }
  if (f.state !== 'all') p.set('state', f.state);
  if (f.device) p.set('device_id', f.device);
  if (f.employee) p.set('employee_id', f.employee);
  return p.toString();
}

export default function Alerts({ searchParams }: { searchParams: Promise<{ employee_id?: string; device_id?: string; state?: string }> }) {
  const me = useMe();
  const sp = use(searchParams);
  const [employee, setEmployee] = useState(sp.employee_id);
  const [type, setType] = useState('all');
  const [state, setState] = useState<State>(sp.state === 'resolved' || sp.state === 'all' ? sp.state : 'open');
  const [device, setDevice] = useState(sp.device_id);
  const [qInput, setQInput] = useState('');
  const [q, setQ] = useState('');
  const [pages, setPages] = useState<Alert[][] | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  const [mailing, setMailing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [person, setPerson] = useState<string | null>(null);

  const isAdmin = me.role === 'company_admin';
  const canResolve = can(me, 'alerts.edit');
  const alertRoles = useAlertRoles(isAdmin);
  const settings = useData<{ alert_email: AlertEmail }>(isAdmin ? '/v1/company/settings' : null);

  useEffect(() => { const t = setTimeout(() => setQ(qInput), 300); return () => clearTimeout(t); }, [qInput]);
  const query = feedQuery({ type, state, q, employee, device });
  const queryRef = useRef(query);
  queryRef.current = query;

  // First page; a poll replaces only page one so pages loaded below stay (A5).
  const loadFirst = useCallback(async (reset: boolean) => {
    const qs = queryRef.current;
    const r = await call<Feed>('GET', `/v1/alerts${qs ? `?${qs}` : ''}`);
    if (qs !== queryRef.current) return; // filters changed while this was in flight
    if (!r.ok) return setError(message(r.status, r.err.code));
    setError(null);
    setCounts(r.data.counts);
    if (r.data.items[0]?.employee && employee) setPerson(r.data.items[0].employee.name);
    setPages((p) => (reset || !p ? [r.data.items] : [r.data.items, ...p.slice(1)]));
    if (reset) setCursor(r.data.next_cursor);
  }, [employee]);

  useEffect(() => { setPages(null); loadFirst(true); }, [query, loadFirst]);
  usePoll(() => { if (pages) loadFirst(false); });

  async function more() {
    if (!cursor) return;
    setBusy(true);
    const qs = queryRef.current;
    const r = await call<Feed>('GET', `/v1/alerts?${qs ? `${qs}&` : ''}cursor=${encodeURIComponent(cursor)}`);
    setBusy(false);
    if (qs !== queryRef.current) return;
    if (!r.ok) return setNote(message(r.status, r.err.code));
    setPages((p) => [...(p ?? []), r.data.items]);
    setCursor(r.data.next_cursor);
  }

  async function resolve(a: Alert) {
    const r = await call<Alert>('POST', `/v1/alerts/${a.id}/resolve`);
    if (isPending(r)) return setNote(SENT);
    if (!r.ok) return setNote(r.status === 404 ? 'This alert no longer exists.' : message(r.status, r.err.code));
    setNote(null);
    setPages((p) => p && p.map((pg) => pg.map((x) => (x.id === a.id ? r.data : x))));
  }

  const seen = new Set<string>();
  const rows = (pages ?? []).flat().filter((a) => !seen.has(a.id) && seen.add(a.id));
  const total = Object.values(counts).reduce((s, n) => s + n, 0);
  const mail = settings.data?.alert_email;

  return (
    <>
      <PageHead title="Alerts"
        sub={<>Signs that WorkBeat was interfered with, or a computer stopped connecting.{mail && ` ${emailSentence(mail, alertRoles)}`}</>}
        right={isAdmin && <button className="btn" disabled={!mail} onClick={() => setMailing(true)}>Email settings</button>} />
      {note && <div className={`notice ${note === SENT ? 'info' : 'warn'}`} role="status">{note}</div>}
      <PendingList resource="alert" />

      <div className="card stack">
        <div className="toolbar">
          <input type="search" className="search" placeholder="Search alerts, computers or people" aria-label="Search alerts, computers or people"
            maxLength={100} value={qInput} onChange={(e) => setQInput(e.target.value)} />
          <select aria-label="Alert type" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="all">All alerts ({total})</option>
            {TYPES.map(([k, l]) => <option key={k} value={k}>{l} ({counts[k] ?? 0})</option>)}
          </select>
          <div className="seg" role="group" aria-label="Alert state">
            {(['open', 'resolved', 'all'] as const).map((s) => (
              <button key={s} className={state === s ? 'on' : ''} aria-pressed={state === s} onClick={() => setState(s)}>
                {{ open: 'Open', resolved: 'Resolved', all: 'All' }[s]}
              </button>
            ))}
          </div>
          {device && <span className="chip" style={{ fontFamily: 'inherit' }}>Computer: {pages?.[0]?.[0]?.hostname ?? 'this computer'}
              <button aria-label="Show alerts for every computer" onClick={() => { setDevice(undefined); history.replaceState(null, '', '/alerts'); }}>×</button></span>}
          {employee && (
            <span className="chip" style={{ fontFamily: 'inherit' }}>Person: {person ?? 'this person'}
              <button aria-label="Show alerts for everyone" onClick={() => { setEmployee(undefined); setPerson(null); history.replaceState(null, '', '/alerts'); }}>×</button>
            </span>
          )}
        </div>

        {error ? (
          <div className="row between"><span>{error}</span><button className="btn" onClick={() => loadFirst(true)}>Try again</button></div>
        ) : (
          <div className="tablewrap">
            <table>
              <thead><tr><th>When</th><th>Alert</th><th>Person</th><th>Computer</th><th>What happened</th><th><span className="sr-only">Status</span></th></tr></thead>
              <tbody>
                {!pages ? <tr><td colSpan={6} className="muted">Loading…</td></tr>
                  : !rows.length ? <tr><td colSpan={6} className="muted">{state === 'open' && !q && type === 'all' ? 'No open alerts. All good.' : 'No alerts match.'}</td></tr>
                  : rows.map((a) => (
                    <tr key={a.id}>
                      <td className="small muted" style={{ whiteSpace: 'nowrap' }} title={full(a.occurred_at, me.tz)}>{when(a.occurred_at, me.tz)}</td>
                      <td><span className={`pill ${SEV(a.event_type)}`}>{label('alert', a.event_type)}</span></td>
                      <td>{!a.employee ? <span className="muted">—</span>
                        : <Link href={`/employees/${a.employee.id}`}>{a.employee.name}</Link>}</td>
                      <td className="small mono">{a.hostname}</td>
                      <td className="small">{describe(a, me.tz)}</td>
                      <td className="small">{a.resolved_at ? (
                        <span className="muted" title={full(a.resolved_at, me.tz)}>
                          Resolved {when(a.resolved_at, me.tz)}{a.resolved_by ? ` by ${a.resolved_by_name ?? 'a removed user'}` : ' (computer reconnected)'}
                        </span>
                      ) : canResolve ? <button className="btn sm" onClick={() => resolve(a)}>Resolve</button> : <span className="pill p-warn">Open</span>}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
        {cursor && pages && !error && <button className="btn" style={{ alignSelf: 'center' }} disabled={busy} onClick={more}>{busy ? 'Loading…' : 'Show more'}</button>}

        <details className="small muted">
          <summary>What each alert means</summary>
          <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
            {TYPES.map(([k, l]) => <li key={k}><b>{l}</b>: {HELP[k]}</li>)}
          </ul>
        </details>
      </div>

      {mail && (
        <EmailSettings open={mailing} value={mail} roles={alertRoles} onClose={() => setMailing(false)}
          onSaved={(v) => { setMailing(false); settings.set((d) => d && { ...d, alert_email: v }); setNote(null); }} />
      )}
    </>
  );
}
