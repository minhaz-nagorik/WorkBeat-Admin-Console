'use client';
import { useState } from 'react';
import { call } from '@/lib/client';
import { Field, PASSWORD_HINT, checkPassword, tooMany, useCooldown } from '@/components/form';

export default function Account() {
  const [cur, setCur] = useState('');
  const [pw, setPw] = useState('');
  const [errs, setErrs] = useState<{ cur?: string; pw?: string }>({});
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useCooldown();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = { cur: cur ? undefined : 'Enter your current password.', pw: checkPassword(pw) };
    setErrs(v); setMsg(null); if (v.cur || v.pw) return;
    setBusy(true);
    const r = await call('POST', '/v1/auth/password', { current_password: cur, new_password: pw });
    setBusy(false);
    if (r.ok) { setCur(''); setPw(''); return setMsg({ ok: true, text: 'Password changed. Your other sessions were signed out.' }); }
    if (r.status === 429) return setWait(r.retryAfter ?? 60);
    if (r.status === 422 && r.err.fields?.includes('current_password')) return setErrs({ cur: 'This is not your current password.' });
    if (r.status === 422) return setErrs({ pw: 'This password is not accepted. Use 10 to 200 characters.' });
    setMsg({ ok: false, text: 'Something went wrong. Try again.' });
  }

  return (
    <>
      <div className="pagehead"><div><h1>Change password</h1><p>Changing it signs you out everywhere else.</p></div></div>
      <form method="post" className="card stack" style={{ maxWidth: 420 }} onSubmit={submit}>
        {(msg || wait > 0) && <div className={`notice ${msg?.ok ? 'ok' : 'warn'}`} role="status">{wait > 0 ? tooMany(wait) : msg?.text}</div>}
        <Field id="current_password" label="Current password" type="password" autoComplete="current-password" error={errs.cur} value={cur} onChange={(e) => setCur(e.target.value)} />
        <Field id="new_password" label="New password" type="password" autoComplete="new-password" hint={PASSWORD_HINT} error={errs.pw} value={pw} onChange={(e) => setPw(e.target.value)} />
        <button className="btn pri" style={{ alignSelf: 'flex-start' }} disabled={busy || wait > 0}>Change password</button>
      </form>
    </>
  );
}
