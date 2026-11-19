'use client';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useMe } from '@/lib/me';
import { useData, Skeleton } from '@/lib/use-data';
import { message } from '@/lib/client';
import { useState } from 'react';
import { RestoreDialog } from '@/components/employee/edit';
import { label } from '@/lib/labels';
import { initials } from '@/lib/format';
import { when, full, dateOnly } from '@/lib/time';
import type { Role } from '@/lib/types';
import type { TabProps } from '@/components/employee/tabs';
import { EmployeeActivity } from '@/components/employee/activity';
import { EmployeeCalendar, EmployeeTimesheet } from '@/components/employee/calendar';
import { EmployeeScreenshots } from '@/components/employee/screenshots';
import { MonitoringSettingsTab } from '@/components/employee/settings';
import { PausesTab } from '@/components/employee/pauses';
import { NoticeTab } from '@/components/employee/notice';
import { AlertTable, type Alert } from '@/components/reports/kit';

type Device = { id: string; hostname: string; os: string; status: string; last_heartbeat_at: string | null };
type Employee = {
  id: string; name: string; email: string | null; department: string | null; archived_at: string | null;
  presence?: string; devices?: Device[];
};

const A: Role = 'company_admin', M: Role = 'manager', I: Role = 'it_admin';
// Who sees which tab (view-reports, manage-employees specs). The API's refusal stays the control (rule 2).
const TABS: { k: string; l: string; roles: Role[]; C: (p: TabProps) => React.ReactNode }[] = [
  { k: 'report', l: 'Report', roles: [A, M], C: EmployeeActivity },
  { k: 'calendar', l: 'Calendar', roles: [A, M], C: EmployeeCalendar },
  { k: 'timesheet', l: 'Timesheet', roles: [A, M], C: EmployeeTimesheet },
  { k: 'screenshots', l: 'Screenshots', roles: [A, M], C: EmployeeScreenshots },
  { k: 'settings', l: 'What is collected', roles: [A, M, I], C: MonitoringSettingsTab },
  { k: 'pauses', l: 'Pause monitoring', roles: [A, M, I], C: PausesTab },
  { k: 'notice', l: 'Monitoring notice', roles: [A], C: NoticeTab },
];
const PRES: Record<string, string> = { active: 'p-ok', idle: 'p-warn', paused: 'p-info' };
const DEV: Record<string, string> = { online: 'p-ok', offline: 'p-warn' };

export default function EmployeePage() {
  const { id } = useParams<{ id: string }>();
  const me = useMe();
  const sp = useSearchParams();
  const router = useRouter();
  const emp = useData<Employee>(`/v1/employees/${id}`);
  const [restoring, setRestoring] = useState(false);
  const tabs = TABS.filter((t) => t.roles.includes(me.role));
  const tab = tabs.find((t) => t.k === sp.get('tab')) ?? tabs[0];

  const back = <Link href="/employees" className="small">← Employees</Link>;
  if (!tab) return <>{back}<div className="card"><p>Activity reports are not available to your role.</p></div></>;
  if (emp.status === 404) return <>{back}<div className="card"><p>This employee isn&apos;t on your team or no longer exists.</p></div></>;
  if (emp.status) return <>{back}<div className="card row between"><span>{message(emp.status, '')}</span><button className="btn" onClick={() => emp.reload()}>Try again</button></div></>;
  if (!emp.data) return <>{back}<Skeleton rows={4} /></>;
  const e = emp.data, archived = !!e.archived_at;
  const go = (k: string) => router.replace(`?tab=${k}`, { scroll: false });

  return (
    <>
      {back}
      <div className="pagehead">
        <div>
          <h1 className="row" style={{ gap: 12 }}>
            <span className="av" aria-hidden="true" style={{ width: 40, height: 40, fontSize: 14 }}>{initials(e.name)}</span>{e.name}
            {e.presence && <span className={`pill ${PRES[e.presence] ?? ''}`}>{label('presence', e.presence)}</span>}
          </h1>
          <p>{[e.department, e.email].filter(Boolean).join(' · ') || 'No department or email'}</p>
        </div>
      </div>
      {archived && (
        <div className="notice warn row between" role="status">
          <span>{e.name} was removed on {dateOnly(e.archived_at!, me.tz)}. Their reports and history stay viewable; nothing can be changed{me.role === 'company_admin' ? ' unless you restore them' : ''}.</span>
          {me.role === 'company_admin' && <button className="btn sm pri" onClick={() => setRestoring(true)}>Restore {e.name}</button>}
        </div>
      )}
      <RestoreDialog emp={restoring ? e : null} onClose={() => setRestoring(false)} onRestored={() => { setRestoring(false); emp.reload(); }} />

      <div className="grid g-wide">
        <div className="card">
          <h2>Computers</h2>
          {!e.devices?.length ? <p className="muted small">No computer is set up for this person yet. Run WorkBeat Setup on their computer and pick {e.name}.</p> : (
            <div className="tablewrap"><table>
              <thead><tr><th>Computer</th><th>Status</th><th>Last seen</th></tr></thead>
              <tbody>{e.devices.map((d) => (
                <tr key={d.id}>
                  <td><span className="mono">{d.hostname}</span><div className="small muted">{label('os', d.os)}</div></td>
                  <td><span className={`pill ${DEV[d.status] ?? ''}`}>{label('deviceStatus', d.status)}</span></td>
                  <td className="small" title={d.last_heartbeat_at ? full(d.last_heartbeat_at, me.tz) : undefined}>{d.last_heartbeat_at ? when(d.last_heartbeat_at, me.tz) : 'Never'}</td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
        <EmployeeAlerts id={e.id} tz={me.tz} />
      </div>

      <div className="tabs" role="tablist" aria-label="Employee sections">
        {tabs.map((t) => (
          <button key={t.k} role="tab" id={`tab-${t.k}`} aria-selected={t === tab} aria-controls="emp-panel" className={t === tab ? 'on' : ''} onClick={() => go(t.k)}>{t.l}</button>
        ))}
      </div>
      <div role="tabpanel" id="emp-panel" aria-labelledby={`tab-${tab.k}`} className="stack">
        {/* keyed on the address so a link from another tab (day, date) starts the tab there */}
        <tab.C key={sp.toString()} employeeId={e.id} tz={me.tz} role={me.role} archived={archived} />
      </div>
    </>
  );
}

function EmployeeAlerts({ id, tz }: { id: string; tz: string }) {
  const a = useData<{ items: Alert[] }>(`/v1/alerts?employee_id=${id}`);
  return (
    <div className="card">
      <div className="cardhead"><h2>Recent alerts</h2><Link className="small" href={`/alerts?employee_id=${id}`}>All alerts for this person</Link></div>
      {a.status ? <p className="small muted">{message(a.status, '')}</p> : !a.data ? <p className="small muted">Loading…</p>
        : <AlertTable items={a.data.items.slice(0, 5)} tz={tz} empty="No alerts for this person's computers." linkPeople={false} />}
    </div>
  );
}
