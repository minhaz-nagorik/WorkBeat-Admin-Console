'use client';
import { useState } from 'react';
import Link from 'next/link';
import { call } from '@/lib/client';
import { Field, PASSWORD_HINT, checkPassword, tooMany, useCooldown } from '@/components/form';
import { Logo } from '@/components/icons';
import { useTokenFromUrl } from '../sign-in/sign-in';

export default function ResetPassword() {
  const token = useTokenFromUrl();
  const [pw, setPw] = useState('');
  const [fieldErr, setFieldErr] = useState<string>();
  const [state, setState] = useState<'form' | 'done' | 'invalid' | 'expired'>('form');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useCooldown();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad = checkPassword(pw); setFieldErr(bad); if (bad) return;
    setBusy(true); setMsg('');
    const r = await call('POST', '/v1/auth/password-reset/confirm', { token, new_password: pw });
    setBusy(false);
    if (r.ok) return setState('done');
    if (r.err.code === 'PASSWORD_RESET_INVALID') return setState('invalid');
    if (r.err.code === 'PASSWORD_RESET_EXPIRED') return setState('expired');
    if (r.status === 429) return setWait(r.retryAfter ?? 60);
    if (r.status === 422) return setFieldErr('This password is not accepted. Use 10 to 200 characters.');
    setMsg('Something went wrong. Try again.');
  }

  const newLink = <Link className="btn pri" href="/sign-in">Send a new link</Link>;
  return (
    <div className="authwrap">
      <div className="card authcard">
        <div className="brand" style={{ padding: 0 }}><Logo /><div><b>WorkBeat</b><span>Admin</span></div></div>
        {token === null ? null : !token || state === 'invalid' ? (
          <div className="stack"><h1>This reset link isn&apos;t valid</h1><p className="muted">Check you used the whole link, or ask for a new one.</p>{newLink}</div>
        ) : state === 'expired' ? (
          <div className="stack"><h1>This reset link has expired or was already used</h1>{newLink}</div>
        ) : state === 'done' ? (
          <div className="stack"><h1>Password changed</h1><p>Every other session was signed out.</p><Link className="btn pri" href="/sign-in">Sign in</Link></div>
        ) : (
          <form method="post" className="stack" onSubmit={submit}>
            <h1>Choose a new password</h1>
            {(msg || wait > 0) && <div className="notice warn" role="alert">{wait > 0 ? tooMany(wait) : msg}</div>}
            <Field id="new_password" label="New password" type="password" autoComplete="new-password" hint={PASSWORD_HINT} error={fieldErr} value={pw} onChange={(e) => setPw(e.target.value)} />
            <button className="btn pri" disabled={busy || wait > 0}>Change password</button>
          </form>
        )}
      </div>
    </div>
  );
}
