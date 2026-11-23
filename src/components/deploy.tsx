'use client';
import { can } from '@/lib/nav';
import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { call } from '@/lib/client';
import { label } from '@/lib/labels';
import { useMe } from '@/lib/me';
import { useData, useRefresh } from '@/lib/use-data';
import { pct } from '@/lib/format';

const SETUP_EVENT = 'workbeat:setup';
const STEP_LINK: Record<string, string> = {
  download_downloader: '/deployment#downloads', copy_license_key: '/deployment#key',
  install_first_device: '/deployment#install', first_device_seen: '/devices',
};

/** Tick a manual checklist step; a failure never blocks the download or copy. */
export async function markStep(step: 'download_downloader' | 'copy_license_key') {
  await call('POST', '/v1/company/setup/steps', { step });
  window.dispatchEvent(new Event(SETUP_EVENT));
}

/** `refresh` set: no polling; the caller reloads it by changing the number (Overview, A5). */
export function SetupChecklist({ refresh }: { refresh?: number } = {}) {
  const me = useMe();
  const s = useData<{ step: string; done: boolean }[]>(me.role === 'company_admin' ? '/v1/company/setup' : null, { poll: refresh === undefined }); // Company Admin only (A14)
  const { reload } = s;
  useRefresh(refresh, reload);
  useEffect(() => {
    const on = () => { reload(); };
    window.addEventListener(SETUP_EVENT, on);
    return () => window.removeEventListener(SETUP_EVENT, on);
  }, [reload]);
  if (!s.data || s.data.every((x) => x.done)) return null;
  const now = s.data.findIndex((x) => !x.done);
  return (
    <div className="card stack">
      <div><h2>Get WorkBeat running</h2><p className="small muted">{s.data.filter((x) => x.done).length} of {s.data.length} done. This list disappears once your first computer reports in.</p></div>
      <ol className="steps" style={{ margin: 0, padding: 0, listStyle: 'none' }}>
        {s.data.map((x, i) => (
          <li key={x.step} className={`step ${x.done ? 'done' : i === now ? 'now' : ''}`}>
            <span className="c" aria-hidden="true">{x.done ? '✓' : i + 1}</span>
            <span><Link href={STEP_LINK[x.step] ?? '/deployment'}>{label('setupStep', x.step)}</Link>
              <span className="sr-only">{x.done ? ' (done)' : ' (not done yet)'}</span></span>
          </li>
        ))}
      </ol>
    </div>
  );
}

type Rollout = {
  status: Record<'online' | 'offline' | 'deactivated' | 'released', number>;
  badges: Record<'outdated' | 'permission_pending' | 'browser_access_pending' | 'paused' | 'open_alert', number>;
  healthy: number;
};

/** [name, pill class, devices filter query, what to do] per row (rollout-status, Plan §5.9). */
const ROWS: [string, string, string, string, (r: Rollout) => number][] = [
  ['Installed and working', 'p-ok', 'status=healthy', 'Nothing', (r) => r.healthy],
  [label('badge', 'permission_pending'), 'p-info', 'badge=permission_pending', 'Ask the employee to allow it in System Settings', (r) => r.badges.permission_pending],
  [label('badge', 'browser_access_pending'), 'p-info', 'badge=browser_access_pending', 'Ask the employee to allow WorkBeat for that browser, or update the browser', (r) => r.badges.browser_access_pending],
  [label('badge', 'outdated'), 'p-warn', 'badge=outdated', 'Check it can download the update, or run WorkBeat Setup again', (r) => r.badges.outdated],
  [label('deviceStatus', 'offline'), '', 'status=offline', 'Check the computer is on and connected', (r) => r.status.offline],
  [label('badge', 'open_alert'), 'p-bad', 'badge=open_alert', 'Review the alert', (r) => r.badges.open_alert],
  [label('badge', 'paused'), 'p-acc', 'badge=paused', 'Nothing; it ends on schedule', (r) => r.badges.paused],
  [label('deviceStatus', 'released'), '', 'status=released', 'Uninstall it, or run WorkBeat Setup to monitor it again', (r) => r.status.released],
  [label('deviceStatus', 'deactivated'), '', 'status=deactivated', 'Uninstall it', (r) => r.status.deactivated],
];
/** What to do, by status or badge value (also used on device detail). */
export const ROLLOUT_ACTION: Record<string, string> = Object.fromEntries(ROWS.map((r) => [r[2].split('=')[1], r[3]]));

export function RolloutCard({ compact, head, refresh }: { compact?: boolean; head?: React.ReactNode; refresh?: number }) {
  const me = useMe();
  const router = useRouter();
  const ok = can(me, 'deployment');
  const r = useData<Rollout>(ok ? '/v1/rollout' : null, { poll: refresh === undefined });
  useRefresh(refresh, r.reload);
  const lic = useData<{ seat_limit: number | null }>(me.role === 'company_admin' ? '/v1/license' : null); // members have no licence access (A14)
  if (!ok) return null;
  const d = r.data;
  const enrolled = d ? Object.values(d.status).reduce((a, b) => a + b, 0) : 0;
  const active = d ? enrolled - d.status.released - d.status.deactivated : 0;
  return (
    <div className="card">
      <div className="cardhead">{head ?? <h2>Rollout status</h2>}<Link href="/devices" className="small">Open devices</Link></div>
      {!d ? <p className="small muted" style={{ marginTop: 12 }}>{r.status ? 'Rollout status could not be loaded.' : 'Loading…'}</p> : (
        <div className="stack" style={{ marginTop: 12 }}>
          <div className="row small muted">
            <span><b className="num" style={{ color: 'var(--fg)' }}>{enrolled}</b> enrolled</span><span aria-hidden="true">·</span>
            <span><b className="num" style={{ color: 'var(--fg)' }}>{lic.data ? lic.data.seat_limit ?? 'Unlimited' : '…'}</b> seats</span><span aria-hidden="true">·</span>
            <span><b className="num" style={{ color: 'var(--fg)' }}>{pct(d.healthy / (active || 1))}</b> healthy</span>
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Status</th><th>Devices</th>{!compact && <th>What to do</th>}</tr></thead>
              <tbody>
                {ROWS.map(([name, cls, q, todo, n]) => (
                  <tr key={q} className="click" onClick={() => router.push(`/devices?${q}`)}>
                    <td><Link href={`/devices?${q}`} className={`pill ${cls}`} style={{ textDecoration: 'none' }}>{name}</Link></td>
                    <td className="num">{n(d)}</td>
                    {!compact && <td className="small">{todo}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
