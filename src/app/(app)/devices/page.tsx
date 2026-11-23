'use client';
import { can } from '@/lib/nav';
import { PendingList } from '@/components/pending';
import { Suspense, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { label, options } from '@/lib/labels';
import { useMe } from '@/lib/me';
import { when, full } from '@/lib/time';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { useList } from '@/components/list';
import { Badges, type Device, shortDate, StatusPill } from './shared';

export default function DevicesPage() {
  return <Suspense><Devices /></Suspense>;
}

const BROWSER_ONLY = ['attention', 'healthy']; // applied in the browser over the full list
const ended = (d: Device) => d.status === 'released' || d.status === 'deactivated';
const attention = (d: Device) => d.status !== 'online' || d.badges.length > 0;

function Devices() {
  const me = useMe();
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const f = { status: sp.get('status') ?? '', badge: sp.get('badge') ?? '', os: sp.get('os') ?? '', employee_id: sp.get('employee_id') ?? '' };

  const api = new URLSearchParams();
  if (f.status && !BROWSER_ONLY.includes(f.status)) api.set('status', f.status);
  for (const k of ['badge', 'os', 'employee_id'] as const) if (f[k]) api.set(k, f[k]);
  const s = useData<Device[]>(`/v1/devices${api.size ? `?${api}` : ''}`, { poll: true });
  const lic = useData<{ seat_limit: number | null; seats_used: number }>(me.role === 'company_admin' ? '/v1/license' : null, { poll: true }); // members: no licence access (A14)

  // Employee choices from every list seen, so picking one keeps the others in the dropdown.
  const people = useRef(new Map<string, string>());
  for (const d of s.data ?? []) people.current.set(d.employee.id, d.employee.name);

  const rows = (s.data ?? [])
    .filter((d) => f.status === 'attention' ? attention(d) : f.status === 'healthy' ? !attention(d) : true)
    .sort((a, b) => Number(ended(a)) - Number(ended(b)));
  const L = useList(rows, (d) => [d.hostname, d.employee.name, d.agent_version].join(' '));

  function set(k: keyof typeof f, v: string) {
    const q = new URLSearchParams(sp);
    if (v) q.set(k, v); else q.delete(k);
    router.replace(`${pathname}${q.size ? `?${q}` : ''}`);
  }
  const lastSeen = (d: Device) => {
    const at = d.status === 'released' ? d.released_at : d.status === 'deactivated' ? d.deactivated_at : null;
    if (at) return <span title={full(at, me.tz)}>{label('deviceStatus', d.status)} {shortDate(at, me.tz)}</span>;
    return d.last_heartbeat_at ? <span title={full(d.last_heartbeat_at, me.tz)}>{when(d.last_heartbeat_at, me.tz)}</span> : 'Not yet';
  };

  return (
    <>
      <PageHead title="Devices" sub={<>
        {lic.data ? `${lic.data.seats_used} of ${lic.data.seat_limit ?? 'unlimited'} seats used. ` : ''}
        Releasing or deactivating a device frees its seat at once. To give a computer to someone else, release it, then run WorkBeat Setup for the new person.
      </>} />
      <PendingList resource="device" />
      <Loaded s={s}>{() => (
        <div className="card stack">
          <div className="toolbar">
            {L.search('Search device, employee or version')}
            <select aria-label="Status" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="">All statuses</option>
              <option value="attention">Needs attention</option>
              <option value="healthy">Installed and working</option>
              {options('deviceStatus').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select aria-label="Issue" value={f.badge} onChange={(e) => set('badge', e.target.value)}>
              <option value="">All issues</option>
              {options('badge').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select aria-label="Operating system" value={f.os} onChange={(e) => set('os', e.target.value)}>
              <option value="">Windows and Mac</option>
              {options('os').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
            <select aria-label="Employee" value={f.employee_id} onChange={(e) => set('employee_id', e.target.value)}>
              <option value="">All employees</option>
              {[...people.current].sort((a, b) => a[1].localeCompare(b[1])).map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Device</th><th>Employee</th><th>Status</th><th>Issues</th><th>Agent</th><th>Last seen</th></tr></thead>
              <tbody>
                {!L.rows.length ? <tr><td colSpan={6} className="muted">{s.data?.length ? 'No devices match.' : 'No devices yet. Install WorkBeat Setup from the Deployment page.'}</td></tr>
                  : L.rows.map((d) => (
                    <tr key={d.id} className="click" onClick={() => router.push(`/devices/${d.id}`)}>
                      <td><Link href={`/devices/${d.id}`} className="mono" onClick={(e) => e.stopPropagation()}>{d.hostname}</Link>
                        <div className="small muted">{label('os', d.os)} {d.os_version}</div></td>
                      <td>{['released', 'deactivated'].includes(d.status) && <span className="small muted">Was: </span>}
                        {can(me, 'employees.view')
                          ? <Link href={`/employees/${d.employee.id}`} onClick={(e) => e.stopPropagation()}>{d.employee.name}</Link>
                          : d.employee.name}</td>
                      <td><StatusPill s={d.status} /></td>
                      <td>{ended(d) ? <span className="muted small">None</span> : <Badges d={d} />}</td>
                      <td className="mono">{d.agent_version}</td>
                      <td className="small muted" style={{ whiteSpace: 'nowrap' }}>{lastSeen(d)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {L.pager}
        </div>
      )}</Loaded>
    </>
  );
}
