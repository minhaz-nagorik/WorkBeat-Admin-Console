'use client';
import { can } from '@/lib/nav';
import { PendingList, SENT } from '@/components/pending';
import { useState } from 'react';
import Link from 'next/link';
import { useData, Loaded, PageHead } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { label, options } from '@/lib/labels';
import { dateOnly } from '@/lib/time';
import { initials } from '@/lib/format';
import { useList } from '@/components/list';
import { EmployeeDialog, RemoveEmployee, RestoreDialog, type Employee, type Manager } from '@/components/employee/edit';
import { ImportDialog } from '@/components/employee/import';

const PILL: Record<string, string> = { active: 'p-ok', idle: 'p-warn', offline: '', paused: 'p-info', no_device: 'plain' };

export default function Employees() {
  const me = useMe();
  const { role, tz } = me;
  const admin = role === 'company_admin';
  const edit = can(me, 'employees.edit'); // a member's changes wait for approval
  const [removed, setRemoved] = useState(false);
  const s = useData<Employee[]>(removed ? '/v1/employees?archived=true' : '/v1/employees', { poll: true });
  const team = useData<{ users: (Manager & { team_only: boolean | null })[] }>(admin ? '/v1/team' : null);
  const managers = (team.data?.users ?? []).filter((u) => u.team_only); // users of a team-only role
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null | undefined>(undefined); // undefined = closed, null = add
  const [importing, setImporting] = useState(false);
  const [restoring, setRestoring] = useState<Employee | null>(null);
  // Add offers Restore for a removed employee's email (D46); only loaded while adding.
  const gone = useData<Employee[]>(admin && editing === null ? '/v1/employees?archived=true' : null);

  const all = (s.data ?? []).filter((e) => removed ? e.archived_at : !e.archived_at);
  const depts = [...new Set(all.map((e) => e.department).filter((d): d is string => !!d))].sort();
  const byDept = all.filter((e) => !dept || e.department === dept);
  const rows = byDept.filter((e) => removed || !status || e.presence === status);
  const L = useList(rows, (e) => [e.name, e.email, e.department, ...e.devices.map((d) => d.hostname)].join(' '));
  const mgrName = (id: string | null) => managers.find((m) => m.id === id)?.name;
  const cols = 4 + (admin ? 1 : 0) + (edit ? 1 : 0);

  return (
    <>
      <PageHead title="Employees"
        sub={edit ? 'Everyone monitored on a company computer.' : 'People assigned to you. This list is read only: you can view their reports but not edit them.'}
        right={edit && !removed && (
          <div className="row">
            <button className="btn" onClick={() => setImporting(true)}>Import CSV</button>
            <button className="btn pri" onClick={() => setEditing(null)}>Add employee</button>
          </div>
        )} />
      {note && <div className="notice ok" role="status">{note}</div>}
      <PendingList resource={['employee', 'employee_import']} />

      <Loaded s={s}>{() => (
        <div className="card stack">
          <div className="toolbar">
            {L.search('Search name, email, department or computer')}
            <select aria-label="Department" value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All departments</option>
              {depts.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
            {!removed && (
              <select aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="">All statuses ({byDept.length})</option>
                {options('presence').map(([k, l]) => <option key={k} value={k}>{l} ({byDept.filter((e) => e.presence === k).length})</option>)}
              </select>
            )}
            {edit && (
              <label className="row small" style={{ gap: 6 }}>
                <input type="checkbox" checked={removed} onChange={(e) => { setRemoved(e.target.checked); setStatus(''); setNote(null); }} /> Show removed employees
              </label>
            )}
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr>
                <th>Name</th><th>Department</th>{admin && <th>Manager</th>}<th>Computers</th>
                <th>{removed ? 'Removed' : 'Status'}</th>{edit && <th><span className="sr-only">Actions</span></th>}
              </tr></thead>
              <tbody>
                {!L.rows.length ? <tr><td colSpan={cols} className="muted">{all.length ? 'Nobody matches.' : removed ? 'No removed employees.' : edit ? 'No employees yet. Add one or import a CSV.' : 'No one is assigned to you yet.'}</td></tr>
                  : L.rows.map((e) => (
                    <tr key={e.id}>
                      <td><div className="who"><span className="av" aria-hidden="true">{initials(e.name)}</span>
                        <div><Link href={`/employees/${e.id}`}>{e.name}</Link><div className="small muted">{e.email ?? 'No email'}</div></div></div></td>
                      <td>{e.department ?? <span className="muted">None</span>}</td>
                      {admin && <td>{mgrName(e.manager_user_id) ?? <span className="muted">None</span>}</td>}
                      <td className="mono">{e.devices.map((d) => d.hostname).join(', ') || <span className="muted">None</span>}</td>
                      <td>{removed && e.archived_at ? dateOnly(e.archived_at, tz) : <span className={`pill ${PILL[e.presence] ?? ''}`}>{label('presence', e.presence)}</span>}</td>
                      {edit && <td>{removed ? admin && e.archived_at && (
                        <button className="btn sm" onClick={() => setRestoring(e)} aria-label={`Restore ${e.name}`}>Restore</button>
                      ) : (
                        <div className="row">
                          <button className="btn sm" onClick={() => setEditing(e)} aria-label={`Edit ${e.name}`}>Edit</button>
                          <RemoveEmployee emp={e} onRemoved={() => { setNote(`${e.name} was removed. Their history is kept under the retention setting.`); s.reload(); }} onSent={() => setNote(SENT)} />
                        </div>
                      )}</td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {L.pager}
        </div>
      )}</Loaded>

      {edit && (
        <>
          <EmployeeDialog open={editing !== undefined} emp={editing} managers={managers} departments={depts}
            removed={gone.data ?? []} onRestoreInstead={admin ? (e) => { setEditing(undefined); setRestoring(e); } : undefined}
            onClose={() => setEditing(undefined)}
            onSaved={(e, added) => { setEditing(undefined); setNote(added ? `${e.name} was added.` : `${e.name} was saved.`); s.reload(); }}
            onSent={() => { setEditing(undefined); setNote(SENT); }} />
          <ImportDialog open={importing} onClose={() => setImporting(false)} onDone={() => s.reload()} />
          <RestoreDialog emp={restoring} onClose={() => setRestoring(null)}
            onRestored={(e) => { setRestoring(null); setNote(`${e.name} was restored with their history.`); s.reload(); }} />
        </>
      )}
    </>
  );
}
