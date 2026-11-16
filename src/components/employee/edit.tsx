'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { call, message } from '@/lib/client';
import { Field } from '@/components/form';
import { ConfirmButton, Modal } from '@/components/confirm';

export type Presence = 'active' | 'idle' | 'offline' | 'paused' | 'tamper' | 'no_device';
export type Employee = {
  id: string; name: string; email: string | null; department: string | null; manager_user_id: string | null;
  archived_at: string | null; presence: Presence;
  /** Unreleased devices only (deactivated included). */
  devices: { id: string; hostname: string; status: string }[];
};
export type Manager = { id: string; name: string };

/** Add (no `emp`) or edit an employee (D47, A12). Company admin only; the API refuses anyone else. */
export function EmployeeDialog({ open, emp, managers, departments, onClose, onSaved }: {
  open: boolean; emp?: Employee | null; managers: Manager[]; departments: string[];
  onClose: () => void; onSaved: (e: Employee, added: boolean) => void;
}) {
  const [f, setF] = useState({ name: '', email: '', department: '', manager_user_id: '' });
  const [err, setErr] = useState<{ name?: string; email?: string; manager?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!open) return;
    setF({ name: emp?.name ?? '', email: emp?.email ?? '', department: emp?.department ?? '', manager_user_id: emp?.manager_user_id ?? '' });
    setErr({});
  }, [open, emp]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.name.trim()) return setErr({ name: 'Enter a name.' });
    if (!f.email.trim()) return setErr({ email: 'Enter their work email.' });
    setBusy(true); setErr({});
    const body = { name: f.name.trim(), email: f.email.trim(), department: f.department.trim() || null, manager_user_id: f.manager_user_id || null };
    const r = emp ? await call<Employee>('PATCH', `/v1/employees/${emp.id}`, body) : await call<Employee>('POST', '/v1/employees', body);
    setBusy(false);
    if (r.ok) return onSaved(r.data, !emp);
    // PATCH 409 is a taken email or an archived employee; an unchanged email means the latter.
    if (r.status === 409 && emp && (emp.email ?? null) === body.email) return setErr({ form: 'This employee was removed and can’t be edited.' });
    if (r.status === 409) return setErr({ email: 'Another employee already uses this email' });
    const fields = r.err.fields ?? [];
    if (fields.includes('manager_user_id')) return setErr({ manager: 'Pick a manager from the list.' });
    if (fields.includes('email')) return setErr({ email: 'Enter a valid work email.' });
    if (fields.includes('name')) return setErr({ name: 'Enter a name of up to 200 characters.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={emp ? `Edit ${emp.name}` : 'Add employee'} open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <Field id="emp-name" label="Full name" required maxLength={200} autoFocus value={f.name} error={err.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <Field id="emp-email" label="Work email" type="email" required maxLength={254} value={f.email} error={err.email}
          hint="IT picks this person in WorkBeat Setup, or passes this email to a scripted install." onChange={(e) => setF({ ...f, email: e.target.value })} />
        <div className="grid g2">
          <Field id="emp-dept" label="Department (optional)" maxLength={200} list="emp-dept-list" value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} />
          <datalist id="emp-dept-list">{departments.map((d) => <option key={d} value={d} />)}</datalist>
          <div className="field">
            <label htmlFor="emp-mgr">Manager</label>
            <select id="emp-mgr" value={f.manager_user_id} aria-invalid={!!err.manager} aria-describedby={err.manager ? 'emp-mgr-err' : undefined}
              onChange={(e) => setF({ ...f, manager_user_id: e.target.value })}>
              <option value="">No manager</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            {err.manager && <span className="err" id="emp-mgr-err" role="alert">{err.manager}</span>}
          </div>
        </div>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : emp ? 'Save' : 'Add employee'}</button>
        </div>
      </form>
    </Modal>
  );
}

/** Remove = archive (D46). Devices must be released first; no reassign (D48). */
export function RemoveEmployee({ emp, onRemoved }: { emp: Employee; onRemoved: () => void }) {
  const [blocked, setBlocked] = useState<string | null>(null);
  const hosts = emp.devices.map((d) => d.hostname).join(', ');
  async function remove() {
    const r = await call('DELETE', `/v1/employees/${emp.id}`);
    if (r.ok) return onRemoved();
    setBlocked(r.status === 409 && r.err.code === 'EMPLOYEE_HAS_DEVICES' ? 'devices' : message(r.status, r.err.code));
  }
  if (blocked) return (
    <div className="notice warn" role="alert" style={{ flexDirection: 'column', gap: 6 }}>
      {blocked === 'devices'
        ? <span>{emp.name} still has {hosts ? <b>{hosts}</b> : 'a device'}. Release {emp.devices.length === 1 ? 'it' : 'them'} on the <Link href="/devices">Devices</Link> page first, then remove {emp.name}.</span>
        : <span>{blocked}</span>}
      <button className="btn sm" onClick={() => setBlocked(null)}>OK</button>
    </div>
  );
  return (
    <ConfirmButton label="Remove" action="Remove employee" onConfirm={remove}
      question={`Remove ${emp.name}? They leave the employee list and reports. Their history is kept and deleted on the normal retention schedule.`} />
  );
}
