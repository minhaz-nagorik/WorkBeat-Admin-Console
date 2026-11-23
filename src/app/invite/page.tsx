'use client';
import { useEffect, useState } from 'react';
import { call } from '@/lib/client';
import { label } from '@/lib/labels';
import { Field, PASSWORD_HINT, checkPassword, tooMany, useCooldown } from '@/components/form';
import { Logo } from '@/components/icons';
import type { Me, Role } from '@/lib/types';
import { SignIn, useTokenFromUrl } from '../sign-in/sign-in';

type Lookup = { email: string; role: Role; role_name?: string | null; company_name: string | null };
const roleWords = (l: Lookup) => (l.role === 'member' ? `${/^[aeiou]/i.test(l.role_name ?? '') ? 'an' : 'a'} ${l.role_name}` : `a ${label('role', l.role)}`);

export default function Invite() {
  const token = useTokenFromUrl();
  const [inv, setInv] = useState<Lookup | 'invalid' | 'expired' | 'error' | null>(null);
  const [name, setName] = useState('');
  const [pw, setPw] = useState('');
  const [errs, setErrs] = useState<{ name?: string; password?: string }>({});
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [staffDone, setStaffDone] = useState<string | null>(null);
  const [wait, setWait] = useCooldown();

  useEffect(() => {
    if (token === null) return;
    if (!token) return setInv('invalid');
    call<Lookup>('POST', '/v1/invitations/lookup', { token }).then((r) => {
      if (r.ok) return setInv(r.data);
      setInv(r.err.code === 'INVITATION_INVALID' ? 'invalid' : r.err.code === 'INVITATION_EXPIRED' ? 'expired' : 'error');
    });
  }, [token]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (typeof inv !== 'object' || !inv) return;
    const v = { name: name.trim() ? undefined : 'Enter your name.', password: checkPassword(pw) };
    setErrs(v); if (v.name || v.password) return;
    setBusy(true); setMsg('');
    const r = await call<{ user: Me }>('POST', '/v1/invitations/accept', { token, name: name.trim(), password: pw });
    setBusy(false);
    if (r.ok) {
      if (inv.role === 'super_admin') return setStaffDone(inv.email); // no session for staff: they sign in with the new password
      return location.replace('/overview');
    }
    if (r.err.code === 'INVITATION_INVALID') return setInv('invalid');
    if (r.err.code === 'INVITATION_EXPIRED') return setInv('expired');
    if (r.status === 429) return setWait(r.retryAfter ?? 60);
    if (r.status === 422 || r.status === 400) {
      const f = r.err.fields ?? [];
      return setErrs({
        name: f.includes('name') ? 'Check your name.' : undefined,
        password: f.includes('password') || !f.length ? 'This password is not accepted. Use 10 to 200 characters.' : undefined,
      });
    }
    setMsg('Something went wrong. Try again.');
  }

  if (staffDone) return <SignIn company="Internal console" next={null} expired={false} email={staffDone} />;

  return (
    <div className="authwrap">
      <div className="card authcard">
        <div className="brand" style={{ padding: 0 }}><Logo /><div><b>WorkBeat</b><span>Admin</span></div></div>
        {inv === null ? <p className="muted">Checking your invitation…</p>
          : inv === 'invalid' ? <p role="alert">This invitation link isn&apos;t valid. Check you used the whole link, or ask your admin for a new one.</p>
          : inv === 'expired' ? <p role="alert">This invitation has expired, was already used or was cancelled. Ask your admin for a new one.</p>
          : inv === 'error' ? <p role="alert">Something went wrong. <button className="linkbtn" onClick={() => location.reload()}>Try again</button></p>
          : (
            <form method="post" className="stack" onSubmit={submit}>
              <h1>{inv.role === 'super_admin' ? "You're invited to WorkBeat staff" : `You're invited as ${roleWords(inv)} of ${inv.company_name}`}</h1>
              <p className="muted">Create your account for <b>{inv.email}</b>.</p>
              {(msg || wait > 0) && <div className="notice warn" role="alert">{wait > 0 ? tooMany(wait) : msg}</div>}
              <Field id="name" label="Your name" autoComplete="name" error={errs.name} value={name} onChange={(e) => setName(e.target.value)} />
              <Field id="password" label="Password" type="password" autoComplete="new-password" hint={PASSWORD_HINT} error={errs.password} value={pw} onChange={(e) => setPw(e.target.value)} />
              <button className="btn pri" disabled={busy || wait > 0}>Create account</button>
            </form>
          )}
      </div>
    </div>
  );
}
