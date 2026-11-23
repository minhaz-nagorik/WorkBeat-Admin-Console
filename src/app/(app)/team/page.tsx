'use client';
import { useCallback, useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { useList } from '@/components/list';
import { Confirm, ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import { isPending, PendingList, SENT } from '@/components/pending';
import { PERMS, type CustomRole, type Me, type Perm, type Role } from '@/lib/types';
import { initials } from '@/lib/format';

type User = { id: string; name: string; email: string; role: Role; role_id: string | null; role_name: string | null; team_only: boolean | null; created_at: string };
type Invite = { id: string; email: string; role: Role; role_id: string | null; role_name: string | null; created_at: string; expires_at: string };
type Employee = { id: string; name: string; department: string | null; manager_user_id: string | null };
type Row = { kind: 'user'; u: User } | { kind: 'invite'; i: Invite };

// One value per choice: 'company_admin' or a custom role's id (backend 0013).
const ADMIN = 'company_admin';
const choiceOf = (x: { role: Role; role_id: string | null }) => (x.role === 'company_admin' ? ADMIN : x.role_id ?? '');
const bodyOf = (choice: string) => (choice === ADMIN ? { role: 'company_admin' } : { role: 'member', role_id: choice });
const roleText = (x: { role: Role; role_name: string | null }) => (x.role === 'company_admin' ? 'Company Admin' : x.role_name ?? 'No role');
const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

export default function Team() {
  const [me, setMe] = useState<Me | null>(null);
  const [team, setTeam] = useState<{ users: User[]; invitations: Invite[] } | null>(null);
  const [emps, setEmps] = useState<Employee[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);
  const [pendingRole, setPendingRole] = useState<{ id: string; role: string; orphans: number } | null>(null);
  const [roles, setRoles] = useState<CustomRole[]>([]);

  const load = useCallback(async () => {
    const [m, t, e, r] = await Promise.all([
      call<Me>('GET', '/v1/me'), call<typeof team>('GET', '/v1/team'), call<Employee[]>('GET', '/v1/employees'), call<CustomRole[]>('GET', '/v1/roles'),
    ]);
    if (!t.ok) return setError(message(t.status, t.err.code));
    setError(null);
    if (m.ok) setMe(m.data);
    setTeam(t.data);
    if (e.ok) setEmps(e.data);
    if (r.ok) setRoles(r.data);
  }, []);
  useEffect(() => { load(); }, [load]);

  const rows: Row[] = team ? [
    ...team.users.map((u) => ({ kind: 'user' as const, u })),
    ...team.invitations.map((i) => ({ kind: 'invite' as const, i })),
  ] : [];
  const L = useList(rows, (r) => r.kind === 'user'
    ? [r.u.name, r.u.email, roleText(r.u), 'active'].join(' ')
    : [r.i.email, roleText(r.i), 'invite sent'].join(' '));

  const say = (ok: boolean, text: string) => setNote({ ok, text });
  const teamOf = (userId: string) => emps.filter((e) => e.manager_user_id === userId).length;

  async function changeRole(id: string, role: string) {
    setPendingRole(null);
    const r = await call<User>('PATCH', `/v1/team/users/${id}`, bodyOf(role));
    if (isPending(r)) { say(true, SENT); return load(); }
    if (r.ok) { say(true, 'Role changed.'); return load(); }
    if (r.status === 409) return say(false, 'A company needs at least one Company Admin.');
    say(false, message(r.status, r.err.code));
    load();
  }

  function pickRole(u: User, role: string) {
    const stillLead = roles.find((x) => x.id === role)?.team_only;
    const orphans = u.team_only && !stillLead ? teamOf(u.id) : 0;
    if (orphans) return setPendingRole({ id: u.id, role, orphans });
    changeRole(u.id, role);
  }

  async function remove(u: User) {
    const r = await call('DELETE', `/v1/team/users/${u.id}`);
    if (isPending(r)) return say(true, SENT);
    if (r.ok) { say(true, `${u.name} was removed and signed out.`); return load(); }
    say(false, r.status === 409 ? 'A company needs at least one Company Admin.' : message(r.status, r.err.code));
  }

  async function resend(i: Invite) {
    const r = await call('POST', `/v1/team/invitations/${i.id}/resend`);
    if (isPending(r)) return say(true, SENT);
    if (r.ok) { say(true, `A new link was sent to ${i.email}. The old link no longer works.`); return load(); }
    say(false, r.status === 409 ? 'This invitation was already accepted.' : message(r.status, r.err.code));
    load();
  }

  async function cancel(i: Invite) {
    const r = await call('DELETE', `/v1/team/invitations/${i.id}`);
    if (isPending(r)) return say(true, SENT);
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
      <PendingList resource={['invitation', 'user', 'role']} onChange={load} />

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
                    <td>{r.u.id === me?.id ? roleText(r.u) : (
                      <select aria-label={`Role for ${r.u.name}`} style={{ maxWidth: 180 }} value={pendingRole?.id === r.u.id ? pendingRole.role : choiceOf(r.u)}
                        onChange={(e) => pickRole(r.u, e.target.value)}>
                        <RoleOptions roles={roles} />
                      </select>
                    )}</td>
                    <td><span className="pill p-ok">Active</span></td>
                    <td>{r.u.id === me?.id ? <span className="small muted">You</span>
                      : pendingRole?.id === r.u.id ? (
                        <Confirm question={`${pendingRole.orphans} ${pendingRole.orphans === 1 ? 'employee' : 'employees'} will have no manager. Change role?`}
                          action="Change role" onConfirm={() => changeRole(pendingRole.id, pendingRole.role)} onCancel={() => setPendingRole(null)} />
                      ) : (
                        <ConfirmButton label="Remove" onConfirm={() => remove(r.u)}
                          question={`Remove ${r.u.name}? They are signed out and can't sign in again${r.u.team_only && teamOf(r.u.id) ? `, and ${teamOf(r.u.id)} employees will have no manager` : ''}.`} />
                      )}</td>
                  </tr>
                ) : (
                  <tr key={r.i.id}>
                    <td><div className="who"><span className="av" aria-hidden="true">{initials(r.i.email)}</span><div>{r.i.email}<div className="small muted">Expires {day(r.i.expires_at)}</div></div></div></td>
                    <td>{roleText(r.i)}</td>
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

      {team && <ManagerTeams managers={team.users.filter((u) => u.team_only)} emps={emps} onChange={load} say={say} />}
      <Roles roles={roles} onChange={load} say={say} />

      <InviteDialog open={inviting} roles={roles} onClose={() => setInviting(false)}
        onSent={(email, pending) => { setInviting(false); say(true, pending ? SENT : `Invitation sent to ${email}.`); load(); }} />
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

function RoleOptions({ roles }: { roles: CustomRole[] }) {
  return (<>
    <option value={ADMIN}>Company Admin</option>
    {roles.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
  </>);
}

const permsText = (x: CustomRole) =>
  [x.team_only && 'Own team only', ...PERMS.filter((p) => x.permissions.includes(p) && !(p.endsWith('.view') && x.permissions.includes(p.replace('.view', '.edit') as Perm))).map((p) => label('perm', p))]
    .filter(Boolean).join(' · ') || 'Nothing yet';

function InviteDialog({ open, roles, onClose, onSent }: { open: boolean; roles: CustomRole[]; onClose: () => void; onSent: (email: string, pending: boolean) => void }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<string>(ADMIN);
  const [err, setErr] = useState<{ email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setEmail(''); setRole(roles[0]?.id ?? ADMIN); setErr({}); } }, [open, roles]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call('POST', '/v1/team/invitations', { email: email.trim(), ...bodyOf(role) });
    setBusy(false);
    if (isPending(r)) return onSent(email.trim(), true);
    if (r.ok) return onSent(email.trim(), false);
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
          {roles.map((x) => (
            <label key={x.id} className="radio-row">
              <input type="radio" name="invite-role" value={x.id} checked={role === x.id} onChange={() => setRole(x.id)} />
              <span><b>{x.name}</b><br /><span className="small muted">{permsText(x)}</span></span>
            </label>
          ))}
          <label className="radio-row">
            <input type="radio" name="invite-role" value={ADMIN} checked={role === ADMIN} onChange={() => setRole(ADMIN)} />
            <span><b>Company Admin</b><br /><span className="small muted">Everything, including team, roles, approvals and company settings.</span></span>
          </label>
          {!roles.length && <p className="small muted">Make a role under Roles below to invite someone with less access.</p>}
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
        <div><h2>Manager teams</h2><p className="small muted">Pick a person in a team-only role, then tick the employees on their team. They only see those employees; each employee has at most one manager.</p></div>
        {managers.length > 0 && (
          <div className="row">
            {L.search('Search employees')}
            <label className="row" style={{ gap: 6 }}>Team of
              <select style={{ maxWidth: 280 }} value={current} onChange={(e) => setMgr(e.target.value)}>
                {managers.map((m) => <option key={m.id} value={m.id}>{m.name} ({m.email})</option>)}
              </select>
            </label>
          </div>
        )}
      </div>
      {!managers.length ? <p className="muted small">No one is in a team-only role yet. Make a role with “Own team only” and give it to someone.</p>
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

// Custom roles (backend 0013): a name, what it may see or change, and "own team only".
// Edit rights bring their view right. Members' changes always wait for a Company Admin.
function Roles({ roles, onChange, say }: { roles: CustomRole[]; onChange: () => void; say: (ok: boolean, t: string) => void }) {
  const [editing, setEditing] = useState<CustomRole | 'new' | null>(null);

  async function remove(x: CustomRole) {
    const r = await call('DELETE', `/v1/roles/${x.id}`);
    if (isPending(r)) return say(true, SENT);
    if (r.ok) { say(true, `The role ${x.name} was deleted.`); return onChange(); }
    say(false, r.status === 409 ? `Give ${x.name}'s people another role first.` : message(r.status, r.err.code));
  }

  return (
    <div className="card stack">
      <div className="cardhead">
        <div><h2>Roles</h2><p className="small muted">Company Admin can do everything. Make other roles and choose what each may see or change. Their changes always wait for a Company Admin’s approval.</p></div>
        <button className="btn" onClick={() => setEditing('new')}>New role</button>
      </div>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Role</th><th>Can</th><th>People</th><th><span className="sr-only">Actions</span></th></tr></thead>
          <tbody>
            <tr><td><b>Company Admin</b></td><td className="small">Everything, including team, roles, approvals and company settings</td><td className="small muted">Fixed</td><td /></tr>
            {roles.map((x) => (
              <tr key={x.id}>
                <td><b>{x.name}</b></td>
                <td className="small">{permsText(x)}</td>
                <td className="small">{x.users}</td>
                <td><div className="row">
                  <button className="btn sm" onClick={() => setEditing(x)}>Edit</button>
                  <ConfirmButton label="Delete" question={`Delete the role ${x.name}? Open invitations with this role are cancelled.`} onConfirm={() => remove(x)} />
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <RoleDialog role={editing} onClose={() => setEditing(null)}
        onSaved={(text) => { setEditing(null); say(true, text); onChange(); }} />
    </div>
  );
}

function RoleDialog({ role, onClose, onSaved }: { role: CustomRole | 'new' | null; onClose: () => void; onSaved: (text: string) => void }) {
  const [name, setName] = useState('');
  const [perms, setPerms] = useState<Perm[]>([]);
  const [teamOnly, setTeamOnly] = useState(false);
  const [err, setErr] = useState<{ name?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!role) return;
    setName(role === 'new' ? '' : role.name); setPerms(role === 'new' ? [] : role.permissions);
    setTeamOnly(role === 'new' ? false : role.team_only); setErr({});
  }, [role]);
  // Ticking an edit right ticks its view right; unticking a view right unticks its edit right.
  const toggle = (p: Perm, on: boolean) => setPerms((cur) => {
    const pair = (p.endsWith('.edit') ? p.replace('.edit', '.view') : p.replace('.view', '.edit')) as Perm;
    const next = new Set(cur);
    if (on) { next.add(p); if (p.endsWith('.edit')) next.add(pair); } else { next.delete(p); if (p.endsWith('.view')) next.delete(pair); }
    return PERMS.filter((x) => next.has(x));
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const body = { name: name.trim(), permissions: perms, team_only: teamOnly };
    const r = role === 'new' ? await call('POST', '/v1/roles', body) : await call('PATCH', `/v1/roles/${(role as CustomRole).id}`, body);
    setBusy(false);
    if (isPending(r)) return onSaved(SENT);
    if (r.ok) return onSaved(role === 'new' ? `The role ${body.name} was created.` : `The role ${body.name} was saved.`);
    if (r.status === 409) return setErr({ name: 'A role with this name exists.' });
    if (r.status === 422) return setErr({ name: 'Enter a name of up to 60 characters.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={role === 'new' ? 'New role' : 'Edit role'} open={!!role} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <Field id="role-name" label="Role name" required autoFocus value={name} error={err.name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
          <legend className="small" style={{ fontWeight: 500, marginBottom: 6 }}>What this role may do</legend>
          {PERMS.map((p) => (
            <label key={p} className="row" style={{ gap: 8 }}>
              <input type="checkbox" checked={perms.includes(p)} onChange={(e) => toggle(p, e.target.checked)} />
              <span>{label('perm', p)}</span>
            </label>
          ))}
          <label className="row" style={{ gap: 8, marginTop: 6 }}>
            <input type="checkbox" checked={teamOnly} onChange={(e) => setTeamOnly(e.target.checked)} />
            <span><b>Own team only</b><br /><span className="small muted">Sees only the employees on their team (set under Manager teams).</span></span>
          </label>
        </fieldset>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save role'}</button>
        </div>
      </form>
    </Modal>
  );
}
