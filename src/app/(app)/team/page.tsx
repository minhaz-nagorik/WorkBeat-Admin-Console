'use client';
import { useCallback, useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { useList } from '@/components/list';
import { Confirm, ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import type { Me, Role } from '@/lib/types';

type User = { id: string; name: string; email: string; role: Role; created_at: string };
type Invite = { id: string; email: string; role: Role; created_at: string; expires_at: string };
type Employee = { id: string; name: string; department: string | null; manager_user_id: string | null };
type Row = { kind: 'user'; u: User } | { kind: 'invite'; i: Invite };

const ROLES: [Role, string][] = [
  ['manager', 'Sees reports, calendar and screenshots of their own team.'],
  ['it_admin', 'Installs WorkBeat, manages computers, the block list and alerts. No reports.'],
  ['company_admin', 'Everything, including team, billing and company settings.'],
];
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
const initials = (n: string) => n.split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase();

export default function Team() {
  const [me, setMe] = useState<Me | null>(null);
  const [team, setTeam] = useState<{ users: User[]; invitations: Invite[] } | null>(null);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);
  const [pendingRole, setPendingRole] = useState<{ id: string; role: Role; orphans: number } | null>(null);

  const load = useCallback(async () => {
    const [m, t, e] = await Promise.all([
      call<Me>('GET', '/v1/me'), call<typeof team>('GET', '/v1/team'), call<Employee[]>('GET', '/v1/employees'),
    ]);
    if (!t.ok) return setError(message(t.status, t.err.code));
    setError(null);
    if (m.ok) setMe(m.data);
    setTeam(t.data);
    if (e.ok) setEmps(e.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows: Row[] = team ? [
    ...team.users.map((u) => ({ kind: 'user' as const, u })),
    ...team.invitations.map((i) => ({ kind: 'invite' as const, i })),
  ] : [];
  const L = useList(rows, (r) => r.kind === 'user'
    ? [r.u.name, r.u.email, label('role', r.u.role), 'active'].join(' ')
    : [r.i.email, label('role', r.i.role), 'invite sent'].join(' '));

  const say = (ok: boolean, text: string) => setNote({ ok, text });
  const teamOf = (userId: string) => emps.filter((e) => e.manager_user_id === userId).length;

  async function changeRole(id: string, role: Role) {
    setPendingRole(null);
    const r = await call<User>('PATCH', `/v1/team/users/${id}`, { role });
    if (r.ok) { say(true, 'Role changed.'); return load(); }
    if (r.status === 409) return say(false, 'A company needs at least one Company Admin.');
    say(false, message(r.status, r.err.code));
    load();
  }

  function pickRole(u: User, role: Role) {
    const orphans = u.role === 'manager' && role !== 'manager' ? teamOf(u.id) : 0;
    if (orphans) return setPendingRole({ id: u.id, role, orphans });
    changeRole(u.id, role);
  }

  async function remove(u: User) {
    const r = await call('DELETE', `/v1/team/users/${u.id}`);
    if (r.ok) { say(true, `${u.name} was removed and signed out.`); return load(); }
    say(false, r.status === 409 ? 'A company needs at least one Company Admin.' : message(r.status, r.err.code));
  }

  async function resend(i: Invite) {
    const r = await call('POST', `/v1/team/invitations/${i.id}/resend`);
    if (r.ok) { say(true, `A new link was sent to ${i.email}. The old link no longer works.`); return load(); }
    say(false, r.status === 409 ? 'This invitation was already accepted.' : message(r.status, r.err.code));
    load();
  }

  async function cancel(i: Invite) {
    const r = await call('DELETE', `/v1/team/invitations/${i.id}`);
    if (r.ok) { say(true, `The invitation for ${i.email} was cancelled.`); return load(); }
    say(false, r.status === 409 ? 'This invitation was already accepted.' : message(r.status, r.err.code));
    load();
  }

  if (error) return (
    <>
      <Head onInvite={() => {}} canInvite={false} />
      <div className="card stack"><p>{error}</p>{!error.startsWith('You') && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={load}>Try again</button>}</div>
    </>
  );

  return (
    <>
      <Head onInvite={() => setInviting(true)} canInvite={!!team} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}

      <div className="card stack">
        <div className="toolbar">{L.search('Search people')}</div>
        <div className="tablewrap">
          <table>
            <thead><tr><th>Name</th><th>Role</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {!team ? <tr><td colSpan={4} className="muted">Loading…</td></tr>
                : !L.rows.length ? <tr><td colSpan={4} className="muted">{rows.length ? 'Nobody matches your search.' : 'No one yet.'}</td></tr>
                : L.rows.map((r) => r.kind === 'user' ? (
                  <tr key={r.u.id}>
                    <td><div className="who"><span className="av" aria-hidden="true">{initials(r.u.name)}</span><div>{r.u.name}<div className="small muted">{r.u.email}</div></div></div></td>
                    <td>{r.u.id === me?.id ? label('role', r.u.role) : (
                      <select aria-label={`Role for ${r.u.name}`} style={{ maxWidth: 180 }} value={pendingRole?.id === r.u.id ? pendingRole.role : r.u.role}
                        onChange={(e) => pickRole(r.u, e.target.value as Role)}>
                        {ROLES.map(([k]) => <option key={k} value={k}>{label('role', k)}</option>)}
                      </select>
                    )}</td>
                    <td><span className="pill p-ok">Active</span></td>
                    <td>{r.u.id === me?.id ? <span className="small muted">You</span>
                      : pendingRole?.id === r.u.id ? (
                        <Confirm question={`${pendingRole.orphans} ${pendingRole.orphans === 1 ? 'employee' : 'employees'} will have no manager. Change role?`}
                          action="Change role" onConfirm={() => changeRole(pendingRole.id, pendingRole.role)} onCancel={() => setPendingRole(null)} />
                      ) : (
                        <ConfirmButton label="Remove" onConfirm={() => remove(r.u)}
                          question={`Remove ${r.u.name}? They are signed out and can't sign in again${r.u.role === 'manager' && teamOf(r.u.id) ? `, and ${teamOf(r.u.id)} employees will have no manager` : ''}.`} />
                      )}</td>
                  </tr>
                ) : (
                  <tr key={r.i.id}>
                    <td><div className="who"><span className="av" aria-hidden="true">{initials(r.i.email)}</span><div>{r.i.email}<div className="small muted">Expires {day(r.i.expires_at)}</div></div></div></td>
                    <td>{label('role', r.i.role)}</td>
                    <td><span className="pill p-warn">Invite sent {day(r.i.created_at)}</span></td>
                    <td><div className="row">
                      <button className="btn sm" onClick={() => resend(r.i)}>Resend</button>
                      <ConfirmButton label="Cancel invite" question={`Cancel the invitation for ${r.i.email}? The link stops working.`} onConfirm={() => cancel(r.i)} />
                    </div></td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        {L.pager}
      </div>

      {team && <ManagerTeams managers={team.users.filter((u) => u.role === 'manager')} emps={emps} onChange={load} say={say} />}
      <WhoCanDoWhat />

      <InviteDialog open={inviting} onClose={() => setInviting(false)} onSent={(email) => { setInviting(false); say(true, `Invitation sent to ${email}.`); load(); }} />
    </>
  );
}

function Head({ onInvite, canInvite }: { onInvite: () => void; canInvite: boolean }) {
  return (
    <div className="pagehead">
      <div><h1>Team &amp; roles</h1><p>People who can sign in to the dashboard. Monitored employees are managed on the Employees page.</p></div>
      {canInvite && <button className="btn pri" onClick={onInvite}>Invite someone</button>}
    </div>
  );
}

function InviteDialog({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<Role>('manager');
  const [err, setErr] = useState<{ email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setEmail(''); setRole('manager'); setErr({}); } }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call('POST', '/v1/team/invitations', { email: email.trim(), role });
    setBusy(false);
    if (r.ok) return onSent(email.trim());
    if (r.status === 409) return setErr({ email: 'This person already has an account or an open invitation.' });
    if (r.status === 422 || r.status === 400) return setErr({ email: 'Enter a valid work email.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Invite someone" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <Field id="invite-email" label="Work email" type="email" required autoFocus value={email} error={err.email} onChange={(e) => setEmail(e.target.value)} />
        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
          <legend className="small" style={{ fontWeight: 500, marginBottom: 6 }}>Role</legend>
          {ROLES.map(([k, desc]) => (
            <label key={k} className="radio-row">
              <input type="radio" name="invite-role" value={k} checked={role === k} onChange={() => setRole(k)} />
              <span><b>{label('role', k)}</b><br /><span className="small muted">{desc}</span></span>
            </label>
          ))}
        </fieldset>
        <p className="small muted">They get an email with a link to create their account. The link works for 7 days.</p>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
        </div>
      </form>
    </Modal>
  );
}

function ManagerTeams({ managers, emps, onChange, say }: {
  managers: User[]; emps: Employee[]; onChange: () => void; say: (ok: boolean, t: string) => void;
}) {
  const [mgr, setMgr] = useState(managers[0]?.id ?? '');
  const [busy, setBusy] = useState<string | null>(null);
  const L = useList(emps, (e) => `${e.name} ${e.department ?? ''}`, [24, 48, 96]);
  const current = managers.some((m) => m.id === mgr) ? mgr : managers[0]?.id ?? '';
  const nameOf = (id: string | null) => managers.find((m) => m.id === id)?.name;

  async function tick(e: Employee, on: boolean) {
    setBusy(e.id);
    const r = await call('PATCH', `/v1/employees/${e.id}`, { manager_user_id: on ? current : null });
    setBusy(null);
    if (!r.ok) say(false, r.status === 409 ? `${e.name} is archived and can't be moved.` : message(r.status, r.err.code));
    onChange();
  }

  return (
    <div className="card stack">
      <div className="cardhead">
        <div><h2>Manager teams</h2><p className="small muted">Managers only see the employees ticked here. Each employee has at most one manager.</p></div>
        {managers.length > 0 && (
          <div className="row">
            {L.search('Search employees')}
            <select aria-label="Manager" style={{ maxWidth: 240 }} value={current} onChange={(e) => setMgr(e.target.value)}>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
        )}
      </div>
      {!managers.length ? <p className="muted small">No managers yet. Invite someone as a Manager to give them a team.</p>
        : !emps.length ? <p className="muted small">No employees yet. Add them on the Employees page.</p> : (
          <>
            <div className="grid g3" style={{ gap: 8 }}>
              {L.rows.map((e) => {
                const other = e.manager_user_id && e.manager_user_id !== current ? nameOf(e.manager_user_id) : null;
                return (
                  <label key={e.id} className="row" style={{ gap: 8, flexWrap: 'nowrap' }}>
                    <input type="checkbox" checked={e.manager_user_id === current} disabled={busy === e.id} onChange={(ev) => tick(e, ev.target.checked)} />
                    <span>{e.name} <span className="small muted">{[e.department, other && `on ${other}'s team`].filter(Boolean).join(' · ')}</span></span>
                  </label>
                );
              })}
              {!L.rows.length && <span className="muted small">No employees match.</span>}
            </div>
            {L.pager}
          </>
        )}
    </div>
  );
}

const MATRIX: [string, string, string, string][] = [
  ['View employees and live status', 'Yes', 'Own team', 'No'],
  ['Add, edit or remove employees', 'Yes', 'No', 'No'],
  ['Pause monitoring for an employee', 'Yes', 'See only', 'No'],
  ['Usage, website history, calendar, timesheets', 'Yes', 'Own team', 'No'],
  ['Screenshots', 'Yes', 'Own team', 'No'],
  ['Tamper and offline alerts', 'Yes', 'Own team', 'Yes'],
  ['Block list', 'Yes', 'Read', 'Yes'],
  ['Devices and deployment', 'Yes', 'No', 'Yes'],
  ['Productivity rules', 'Edit', 'Read', 'No'],
  ['Team, custom domain, billing, company settings', 'Yes', 'No', 'No'],
];

function WhoCanDoWhat() {
  return (
    <div className="card">
      <h2>Who can do what</h2>
      <div className="tablewrap" style={{ marginTop: 8 }}>
        <table>
          <thead><tr><th>Action</th><th>Company Admin</th><th>Manager</th><th>IT Admin</th></tr></thead>
          <tbody>{MATRIX.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i} className={i ? 'small' : undefined}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
    </div>
  );
}
