'use client';
import { isPending, PendingList, SENT } from '@/components/pending';
import { useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { useMe } from '@/lib/me';
import { full, when } from '@/lib/time';
import { hm } from '@/lib/format';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { ConfirmButton } from '@/components/confirm';
import { ROLLOUT_ACTION } from '@/components/deploy';
import { Badges, type Device, ended, shortDate, StatusPill } from '../shared';

type Counter = number | Record<string, number> | null;
type Detail = Device & {
  helper_status: string | Record<string, string> | null;
  browser_access: Record<string, string> | null;
  permissions: 'not_required' | Record<string, string> | null;
  health: {
    store_bytes: number | null; oldest_unsent_at: string | number | null; dropped_records: Counter; dropped_samples: Counter;
    screenshot_skips: Counter; quarantined_batches: number | null; blocking_status: string | null; helper_restarts_24h: number | null;
    upload_failures_24h: number | null; update_failure: string | null; uptime_seconds: number | null;
    outdated: boolean; notice_ack_version: number | null; reported_policy_version: number | null;
  };
};

const BROWSERS: Record<string, string> = { chrome: 'Chrome', safari: 'Safari', edge: 'Edge', firefox: 'Firefox', brave: 'Brave', arc: 'Arc', opera: 'Opera' };
const browser = (k: string) => BROWSERS[k.toLowerCase()] ?? k;
const size = (b: number) => b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`;

export default function DevicePage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const s = useData<Detail>(`/v1/devices/${id}`, { poll: true });
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function release(d: Detail) {
    const r = await call<Detail>('POST', `/v1/devices/${d.id}/release`);
    if (isPending(r)) return setNote({ ok: true, text: SENT });
    if (r.ok) {
      s.set(() => r.data);
      return setNote({ ok: true, text: `${d.hostname} was released. Its seat is free.` });
    }
    if (r.status === 409) { await s.reload(); return setNote({ ok: false, text: 'This device was already released.' }); }
    if (r.status === 404) { await s.reload(); return setNote({ ok: false, text: 'This device no longer exists.' }); }
    setNote({ ok: false, text: message(r.status, r.err.code) }); // 403 and others: nothing changes on screen
  }

  if (s.status === 404) return (
    <>
      <PageHead title="Device" />
      <div className="card stack"><p>This device no longer exists.</p><Link href="/devices">Back to devices</Link></div>
    </>
  );

  return (
    <>
      <p className="small"><Link href="/devices">← Devices</Link></p>
      <Loaded s={s} rows={6}>{(d) => (
        <>
          <PageHead title={d.hostname} sub={`${label('os', d.os)} ${d.os_version} · ${d.arch} · WorkBeat ${d.agent_version}`} />
          {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
          <PendingList resource="device" />

          <div className="grid g2">
            <div className="card stack">
              <h2>Status</h2>
              <div className="row"><StatusPill s={d.status} />{!ended(d) && <Badges d={d} />}</div>
              <p className="small">{d.status === 'uninstalled' && d.uninstalled_at ? `Uninstalled ${shortDate(d.uninstalled_at, me.tz)} with the WorkBeat Uninstaller. WorkBeat is no longer on this computer and its seat is free.`
                : d.status === 'released' && d.released_at ? `Released ${shortDate(d.released_at, me.tz)}. WorkBeat is still on this computer but switched off, and its seat is free.`
                : d.last_heartbeat_at ? <>Last seen <span title={full(d.last_heartbeat_at, me.tz)}>{when(d.last_heartbeat_at, me.tz)}</span>.</>
                : 'WorkBeat has not reported from this computer yet.'}</p>
              <ToDo d={d} />
            </div>
            <div className="card stack">
              <h2>Employee</h2>
              {ended(d) ? (
                <>
                  <p>Was set up for <b><Link href={`/employees/${d.employee.id}`}>{d.employee.name}</Link></b>. {d.employee.name} is no longer monitored on this computer.</p>
                  <p className="small muted">The link is kept for history. To monitor someone on this computer again, run WorkBeat Setup on it and pick the employee. That uses a seat.</p>
                </>
              ) : (
                <>
                  <p>Set up for <b><Link href={`/employees/${d.employee.id}`}>{d.employee.name}</Link></b>.</p>
                  <p className="small muted">This never changes while the device is monitored. To give this computer to someone else, release it here, then run WorkBeat Setup on it and pick the new employee. That uses a seat.</p>
                </>
              )}
            </div>
          </div>

          {!ended(d) && <Access d={d} />}
          <Health d={d} tz={me.tz} />

          {!ended(d) && (
            <div className="card stack">
              <h2>Actions</h2>
              <div className="stack">
                <div className="row between">
                  <p className="small" style={{ maxWidth: 560 }}><b>Release</b> when the computer leaves monitoring or changes hands: WorkBeat stays on it, switched off, and the seat is freed. To remove WorkBeat, run the WorkBeat Uninstaller on the computer instead, which frees the seat too. Release it here if WorkBeat was deleted without the Uninstaller.</p>
                  <ConfirmButton label="Release" onConfirm={() => release(d)}
                    question={`Release ${d.hostname} (${d.employee.name})? Its seat and ${d.employee.name} are freed, and collection and blocking stop. It uploads what it holds for up to 24 hours, then wipes itself. It comes back only through a new WorkBeat Setup.`} />
                </div>
              </div>
            </div>
          )}
        </>
      )}</Loaded>
    </>
  );
}

function ToDo({ d }: { d: Detail }) {
  const items = [
    ...(d.status !== 'online' ? [d.status] : []),
    ...(ended(d) ? [] : d.badges),
  ];
  if (!items.length) return null;
  return (
    <div className="stack" style={{ gap: 4 }}>
      <h3>What to do</h3>
      <ul className="small" style={{ margin: 0, paddingLeft: 18 }}>
        {items.map((k) => (
          <li key={k}><b>{label(k === d.status ? 'deviceStatus' : 'badge', k)}:</b> {ROLLOUT_ACTION[k]}
            {k === 'open_alert' && <> · <Link href={`/alerts?device_id=${d.id}&state=open`}>See its open alerts</Link></>}</li>
        ))}
      </ul>
    </div>
  );
}

function Access({ d }: { d: Detail }) {
  const helpers = d.helper_status == null ? [] : typeof d.helper_status === 'string' ? [d.helper_status] : Object.values(d.helper_status);
  const perms = d.permissions && d.permissions !== 'not_required' ? Object.entries(d.permissions) : [];
  const browsers = Object.entries(d.browser_access ?? {});
  return (
    <div className="card stack">
      <h2>Helper and access</h2>
      <div className="tablewrap">
        <table>
          <tbody>
            <tr><td>WorkBeat helper</td><td>{!helpers.length ? <span className="muted">Not reported yet</span>
              : helpers.map((h, i) => <span key={i} className={`pill ${h === 'running' ? 'p-ok' : 'p-warn'}`}>{label('helper', h)}</span>)}</td></tr>
            {d.os === 'windows'
              ? <tr><td>Permissions</td><td className="small">Windows needs no permission.</td></tr>
              : perms.map(([k, v]) => (
                <tr key={k}><td>{label('macPermission', k)}</td><td><span className={`pill ${v === 'granted' ? 'p-ok' : 'p-warn'}`}>{label('permission', v)}</span>
                  {v !== 'granted' && <div className="small muted">Ask the employee to allow it in System Settings → Privacy &amp; Security.</div>}</td></tr>
              ))}
            {browsers.map(([k, v]) => (
              <tr key={k}><td>{browser(k)}{d.os === 'macos' && <span className="small muted"> (Automation)</span>}</td>
                <td><span className={`pill ${v === 'granted' ? 'p-ok' : 'p-warn'}`}>{label('grant', v)}</span>
                  {v === 'pending' && <div className="small muted">Ask the employee to allow WorkBeat when {browser(k)} asks{d.os === 'macos' ? ', or in System Settings → Privacy & Security → Automation' : ''}.</div>}
                  {v === 'unreadable' && <div className="small muted">Ask the employee to update {browser(k)}.</div>}</td></tr>
            ))}
            {!browsers.length && <tr><td>Browsers</td><td className="muted small">Not reported yet</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Count({ c }: { c: Counter }) {
  if (c == null) return <span className="muted">—</span>;
  if (typeof c === 'number') return <span className="num">{c}</span>;
  const e = Object.entries(c);
  if (!e.length) return <span className="num">0</span>;
  return <ul style={{ margin: 0, paddingLeft: 18 }}>{e.map(([k, n]) => <li key={k}>{label('dropReason', k)}: <span className="num">{n}</span></li>)}</ul>;
}

function Health({ d, tz }: { d: Detail; tz: string }) {
  const h = d.health;
  if (h.store_bytes == null && h.uptime_seconds == null && h.blocking_status == null && h.helper_restarts_24h == null) return (
    <div className="card stack"><h2>Agent health</h2><p className="small muted">WorkBeat has not reported from this computer yet.</p></div>
  );
  const oldest = h.oldest_unsent_at == null ? null : new Date(h.oldest_unsent_at).toISOString();
  const rows: [string, React.ReactNode][] = [
    ['Data waiting to upload', h.store_bytes == null ? '—' : <>{size(h.store_bytes)}{oldest && <span className="muted"> since {when(oldest, tz)}</span>}</>],
    ['Records dropped', <Count key="r" c={h.dropped_records} />],
    ['Activity samples dropped', <Count key="s" c={h.dropped_samples} />],
    ['Screenshots skipped', <Count key="k" c={h.screenshot_skips} />],
    ['Batches set aside', h.quarantined_batches ?? '—'],
    ['Website blocking', h.blocking_status ? label('blocking', h.blocking_status) : '—'],
    ['Helper restarts (24 h)', h.helper_restarts_24h ?? '—'],
    ['Failed uploads (24 h)', h.upload_failures_24h ?? '—'],
    ['Last update failure', h.update_failure ? 'An update failed. Run WorkBeat Setup again if it keeps failing.' : 'None'],
    ['Running for', h.uptime_seconds == null ? '—' : hm(h.uptime_seconds)],
    ['Outdated', h.outdated ? 'Yes' : 'No'],
    ['Notice version acknowledged', h.notice_ack_version ?? 'None yet'],
    ['Policy version', h.reported_policy_version ?? '—'],
  ];
  return (
    <div className="card stack">
      <h2>Agent health</h2>
      <div className="tablewrap"><table><tbody>{rows.map(([k, v]) => <tr key={k}><td>{k}</td><td className="small">{v}</td></tr>)}</tbody></table></div>
    </div>
  );
}
