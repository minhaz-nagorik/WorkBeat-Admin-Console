'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useData, Loaded, PageHead } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { label, options } from '@/lib/labels';
import { dateOnly } from '@/lib/time';
import { initials } from '@/lib/format';
import { useList } from '@/components/list';
import { EmployeeDialog, RemoveEmployee, type Employee, type Manager } from '@/components/employee/edit';
import { ImportDialog } from '@/components/employee/import';

const PILL: Record<string, string> = { active: 'p-ok', idle: 'p-warn', offline: '', paused: 'p-info', tamper: 'p-bad', no_device: 'plain' };

export default function Employees() {
  const { role, tz } = useMe();
  const admin = role === 'company_admin';
  const [removed, setRemoved] = useState(false);
  const s = useData<Employee[]>(removed ? '/v1/employees?archived=true' : '/v1/employees', { poll: true });
  const team = useData<{ users: (Manager & { role: string })[] }>(admin ? '/v1/team' : null);
  const managers = (team.data?.users ?? []).filter((u) => u.role === 'manager');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [note, setNote] = useState<string | null>(null);
  const [editing, setEditing] = useState<Employee | null | undefined>(undefined); // undefined = closed, null = add
  const [importing, setImporting] = useState(false);

  const all = (s.data ?? []).filter((e) => removed ? e.archived_at : !e.archived_at);
  const depts = [...new Set(all.map((e) => e.department).filter((d): d is string => !!d))].sort();
  const byDept = all.filter((e) => !dept || e.department === dept);
  const rows = byDept.filter((e) => removed || !status || e.presence === status);
  const L = useList(rows, (e) => [e.name, e.email, e.department, ...e.devices.map((d) => d.hostname)].join(' '));
  const mgrName = (id: string | null) => managers.find((m) => m.id === id)?.name;
  const cols = admin ? 6 : 4;

  return (
    <>
      <PageHead title="Employees"
        sub={admin ? 'Everyone monitored on a company computer.' : 'People assigned to you. This list is read only: you can view their reports but not edit them.'}
        right={admin && !removed && (
          <div className="row">
            <button className="btn" onClick={() => setImporting(true)}>Import CSV</button>
            <button className="btn pri" onClick={() => setEditing(null)}>Add employee</button>
          </div>
        )} />
      {note && <div className="notice ok" role="status">{note}</div>}

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
            {admin && (
              <label className="row small" style={{ gap: 6 }}>
                <input type="checkbox" checked={removed} onChange={(e) => { setRemoved(e.target.checked); setStatus(''); setNote(null); }} /> Show removed employees
              </label>
            )}
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr>
                <th>Name</th><th>Department</th>{admin && <th>Manager</th>}<th>Computers</th>
                <th>{removed ? 'Removed' : 'Status'}</th>{admin && <th><span className="sr-only">Actions</span></th>}
              </tr></thead>
              <tbody>
                {!L.rows.length ? <tr><td colSpan={cols} className="muted">{all.length ? 'Nobody matches.' : removed ? 'No removed employees.' : admin ? 'No employees yet. Add one or import a CSV.' : 'No one is assigned to you yet.'}</td></tr>
                  : L.rows.map((e) => (
                    <tr key={e.id}>
                      <td><div className="who"><span className="av" aria-hidden="true">{initials(e.name)}</span>
                        <div><Link href={`/employees/${e.id}`}>{e.name}</Link><div className="small muted">{e.email ?? 'No email'}</div></div></div></td>
                      <td>{e.department ?? <span className="muted">None</span>}</td>
                      {admin && <td>{mgrName(e.manager_user_id) ?? <span className="muted">None</span>}</td>}
                      <td className="mono">{e.devices.map((d) => d.hostname).join(', ') || <span className="muted">None</span>}</td>
                      <td>{removed && e.archived_at ? dateOnly(e.archived_at, tz) : <span className={`pill ${PILL[e.presence] ?? ''}`}>{label('presence', e.presence)}</span>}</td>
                      {admin && <td>{!removed && (
                        <div className="row">
                          <button className="btn sm" onClick={() => setEditing(e)} aria-label={`Edit ${e.name}`}>Edit</button>
                          <RemoveEmployee emp={e} onRemoved={() => { setNote(`${e.name} was removed. Their history is kept under the retention setting.`); s.reload(); }} />
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

      {admin && (
        <>
          <EmployeeDialog open={editing !== undefined} emp={editing} managers={managers} departments={depts}
            onClose={() => setEditing(undefined)}
            onSaved={(e, added) => { setEditing(undefined); setNote(added ? `${e.name} was added.` : `${e.name} was saved.`); s.reload(); }} />
          <ImportDialog open={importing} onClose={() => setImporting(false)} onDone={() => s.reload()} />
        </>
      )}
    </>
  );
}
