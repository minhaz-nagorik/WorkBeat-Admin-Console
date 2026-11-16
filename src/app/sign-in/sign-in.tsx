'use client';
import { useEffect, useState } from 'react';
import { call } from '@/lib/client';
import { Field, tooMany, useCooldown } from '@/components/form';
import { Logo } from '@/components/icons';
import type { Me } from '@/lib/types';

type Step = { kind: 'password' } | { kind: 'forgot' } | { kind: 'forgot-sent' };

const SOMETHING = 'Something went wrong. Try again.';

export function SignIn({ company, next, expired, email: initialEmail = '' }: {
  company: string | null; next: string | null; expired: boolean; email?: string;
}) {
  const [step, setStep] = useState<Step>({ kind: 'password' });
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState(expired ? 'Your session ended. Sign in again.' : '');
  const [busy, setBusy] = useState(false);
  const [wait, setWait] = useCooldown();

  const land = (u: Me) => location.replace(next ?? (u.role === 'super_admin' ? '/staff/companies' : '/overview'));

  function fail(r: { status: number; retryAfter?: number }, fallback = SOMETHING) {
    if (r.status === 429) { setWait(r.retryAfter ?? 60); setMsg(''); return true; }
    setMsg(fallback);
    return false;
  }

  async function submitPassword(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = await call<{ expires_at: string; user: Me }>('POST', '/v1/auth/login', { email, password });
    setBusy(false); setPassword('');
    if (!r.ok) return fail(r, r.status === 401 ? 'Email or password is wrong.' : SOMETHING);
    land(r.data.user);
  }

  async function submitForgot(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setMsg('');
    const r = await call('POST', '/v1/auth/password-reset/request', { email });
    setBusy(false);
    if (r.ok) return setStep({ kind: 'forgot-sent' });
    fail(r);
  }

  const disabled = busy || wait > 0;
  const notice = wait > 0 ? tooMany(wait) : msg;

  return (
    <div className="authwrap">
      <div className="card authcard">
        <div className="brand" style={{ padding: 0 }}>
          <Logo />
          <div><b>WorkBeat</b><span>{company ?? 'Admin'}</span></div>
        </div>
        {notice && <div className={`notice ${expired && !wait && notice.startsWith('Your session') ? 'info' : 'warn'}`} role="alert">{notice}</div>}

        {step.kind === 'password' && (
          <form method="post" className="stack" onSubmit={submitPassword}>
            <h1>Sign in</h1>
            <Field id="email" label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field id="password" label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn pri" disabled={disabled}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" className="linkbtn small" style={{ alignSelf: 'flex-start' }} onClick={() => { setMsg(''); setStep({ kind: 'forgot' }); }}>Forgot password?</button>
          </form>
        )}

        {step.kind === 'forgot' && (
          <form method="post" className="stack" onSubmit={submitForgot}>
            <h1>Reset your password</h1>
            <p className="muted">Enter your email and we will send you a link to choose a new password.</p>
            <Field id="email" label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <button className="btn pri" disabled={disabled}>Send link</button>
            <BackToSignIn onClick={() => { setMsg(''); setStep({ kind: 'password' }); }} />
          </form>
        )}

        {step.kind === 'forgot-sent' && (
          <div className="stack">
            <h1>Check your email</h1>
            <p>If that email has an account, a reset link is on its way. The link works for 30 minutes.</p>
            <BackToSignIn onClick={() => setStep({ kind: 'password' })} />
          </div>
        )}
      </div>
    </div>
  );
}

const BackToSignIn = ({ onClick }: { onClick: () => void }) => (
  <button type="button" className="linkbtn small" style={{ alignSelf: 'flex-start' }} onClick={onClick}>Back to sign in</button>
);

/** Remove a one-time token from the address bar once the page has read it. */
export function useTokenFromUrl(): string | null {
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const u = new URL(location.href);
    setToken(u.searchParams.get('token') ?? '');
    u.searchParams.delete('token');
    history.replaceState(null, '', u.pathname + u.search);
  }, []);
  return token;
}
