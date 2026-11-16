'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { dateOnly } from '@/lib/time';
import { initials } from '@/lib/format';
import { useList } from '@/components/list';
import { ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';

type User = { id: string; name: string; email: string; created_at: string };
type Invite = { id: string; email: string; created_at: string; expires_at: string };
type Team = { users: User[]; invitations: Invite[] };
type Row = { kind: 'user'; u: User } | { kind: 'invite'; i: Invite };
const day = (iso: string) => `${dateOnly(iso, 'UTC')} (UTC)`;

export default function StaffTeam() {
  const me = useMe();
  const s = useData<Team>('/v1/staff/team');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [inviting, setInviting] = useState(false);
  const rows: Row[] = s.data ? [
    ...s.data.users.map((u) => ({ kind: 'user' as const, u })),
    ...s.data.invitations.map((i) => ({ kind: 'invite' as const, i })),
  ] : [];
  const L = useList(rows, (r) => r.kind === 'user' ? `${r.u.name} ${r.u.email}` : `${r.i.email} invite sent`);
  const say = (ok: boolean, text: string) => setNote({ ok, text });

  async function remove(u: User) {
    const r = await call('DELETE', `/v1/staff/users/${u.id}`);
    if (r.ok) { say(true, `${u.name} was removed and signed out.`); return s.reload(); }
    say(false, r.status === 409 ? "You can't remove the last super admin." : message(r.status, r.err.code));
  }
  async function resend(i: Invite) {
    const r = await call<{ expires_at: string }>('POST', `/v1/staff/invitations/${i.id}/resend`);
    if (r.ok) say(true, `A new link was sent to ${i.email}. It expires ${day(r.data.expires_at)}.`);
    else say(false, r.status === 409 ? 'This invitation was already accepted or cancelled.' : message(r.status, r.err.code));
    s.reload();
  }
  async function revoke(i: Invite) {
    const r = await call('DELETE', `/v1/staff/invitations/${i.id}`);
    if (r.ok) say(true, `The invitation for ${i.email} was cancelled.`);
    else say(false, message(r.status, r.err.code));
    s.reload();
  }

  return (
    <>
      <PageHead title="Staff team" sub="WorkBeat staff who can sign in to this internal console."
        right={s.data && <button className="btn pri" onClick={() => setInviting(true)}>Invite staff</button>} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <Loaded s={s}>{() => (
        <div className="card stack">
          <div className="toolbar">{L.search('Search staff')}</div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Name</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {!L.rows.length ? <tr><td colSpan={3} className="muted">{rows.length ? 'Nobody matches your search.' : 'No one yet.'}</td></tr>
                  : L.rows.map((r) => r.kind === 'user' ? (
                    <tr key={r.u.id}>
                      <td><div className="who"><span className="av" aria-hidden="true">{initials(r.u.name)}</span><div>{r.u.name}<div className="small muted">{r.u.email}</div></div></div></td>
                      <td><span className="pill p-ok">Active</span></td>
                      <td>{r.u.id === me.id ? <span className="small muted">You</span> : (
                        <div className="row">
                          <ConfirmButton label="Remove" onConfirm={() => remove(r.u)}
                            question={`Remove ${r.u.name}? They are signed out at once and can't sign in again.`} />
                        </div>
                      )}</td>
                    </tr>
                  ) : (
                    <tr key={r.i.id}>
                      <td><div className="who"><span className="av" aria-hidden="true">{initials(r.i.email)}</span><div>{r.i.email}<div className="small muted">Expires {day(r.i.expires_at)}</div></div></div></td>
                      <td><span className="pill p-warn">Invite sent</span></td>
                      <td><div className="row">
                        <button className="btn sm" onClick={() => resend(r.i)}>Resend</button>
                        <ConfirmButton label="Revoke" question={`Revoke the invitation for ${r.i.email}? The link stops working.`} onConfirm={() => revoke(r.i)} />
                      </div></td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {L.pager}
        </div>
      )}</Loaded>
      <InviteDialog open={inviting} onClose={() => setInviting(false)} onSent={(email) => { setInviting(false); say(true, `Invitation sent to ${email}.`); s.reload(); }} />
    </>
  );
}

function InviteDialog({ open, onClose, onSent }: { open: boolean; onClose: () => void; onSent: (email: string) => void }) {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState<{ email?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setEmail(''); setErr({}); } }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call('POST', '/v1/staff/invitations', { email: email.trim() });
    setBusy(false);
    if (r.ok) return onSent(email.trim());
    if (r.status === 409) return setErr({ email: 'This person already has an account or an open invitation.' });
    if (r.status === 422 || r.status === 400) return setErr({ email: 'Enter a valid email.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Invite staff" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <Field id="staff-invite-email" label="Email" type="email" required autoFocus value={email} error={err.email} onChange={(e) => setEmail(e.target.value)} />
        <p className="small muted">They get an email with a link to create their account.</p>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Sending…' : 'Send invitation'}</button>
        </div>
      </form>
    </Modal>
  );
}
