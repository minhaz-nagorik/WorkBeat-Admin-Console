'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { call } from '@/lib/client';
import { Field, tooMany, useCooldown } from '@/components/form';
import { Logo } from '@/components/icons';
import type { Me } from '@/lib/types';

type Login =
  | { mfa_required: false; expires_at: string; user: Me }
  | { mfa_required: true; mfa_enrolled: boolean; mfa_token: string; expires_at: string };

type Step = { kind: 'password' } | { kind: 'code'; mfaToken: string; enroll?: { secret: string; qr: string } } | { kind: 'forgot' } | { kind: 'forgot-sent' };

const SOMETHING = 'Something went wrong. Try again.';

export function SignIn({ company, next, expired, email: initialEmail = '' }: {
  company: string | null; next: string | null; expired: boolean; email?: string;
}) {
  const [step, setStep] = useState<Step>({ kind: 'password' });
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
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
    const r = await call<Login>('POST', '/v1/auth/login', { email, password });
    setBusy(false); setPassword('');
    if (!r.ok) return fail(r, r.status === 401 ? 'Email or password is wrong.' : SOMETHING);
    if (!r.data.mfa_required) return land(r.data.user);
    if (r.data.mfa_enrolled) return setStep({ kind: 'code', mfaToken: r.data.mfa_token });
    const en = await call<{ secret: string; otpauth_uri: string }>('POST', '/v1/auth/mfa/enroll', { mfa_token: r.data.mfa_token });
    if (!en.ok) return fail(en, en.status === 401 ? 'Sign in again.' : SOMETHING);
    const qr = await QRCode.toDataURL(en.data.otpauth_uri, { margin: 1, width: 200 });
    setStep({ kind: 'code', mfaToken: r.data.mfa_token, enroll: { secret: en.data.secret, qr } });
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    if (step.kind !== 'code') return;
    setBusy(true); setMsg('');
    const r = await call<{ expires_at: string; user: Me }>('POST', '/v1/auth/mfa/verify', { mfa_token: step.mfaToken, code });
    setBusy(false); setCode('');
    if (r.ok) return land(r.data.user);
    if (r.status === 401 && r.err.code === 'MFA_CODE_INVALID') {
      const n = r.err.attempts_left;
      return setMsg(`That code didn't work.${n != null ? ` ${n} ${n === 1 ? 'try' : 'tries'} left.` : ''}`);
    }
    if (r.status === 401) { setStep({ kind: 'password' }); return setMsg('Sign in again.'); }
    fail(r);
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
          <form className="stack" onSubmit={submitPassword}>
            <h1>Sign in</h1>
            <Field id="email" label="Email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
            <Field id="password" label="Password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
            <button className="btn pri" disabled={disabled}>{busy ? 'Signing in…' : 'Sign in'}</button>
            <button type="button" className="linkbtn small" style={{ alignSelf: 'flex-start' }} onClick={() => { setMsg(''); setStep({ kind: 'forgot' }); }}>Forgot password?</button>
          </form>
        )}

        {step.kind === 'code' && (
          <form className="stack" onSubmit={submitCode}>
            <h1>{step.enroll ? 'Set up your authenticator' : 'Enter your code'}</h1>
            {step.enroll ? (
              <>
                <p className="muted">WorkBeat staff need an authenticator app. Scan this code with it, or type the key by hand, then enter the 6-digit code it shows.</p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={step.enroll.qr} width={200} height={200} alt="QR code to add WorkBeat to your authenticator app" style={{ alignSelf: 'center' }} />
                <div className="field"><span className="label">Key</span><div className="secret">{step.enroll.secret}</div></div>
              </>
            ) : (
              <p className="muted">Open your authenticator app and enter the 6-digit code for WorkBeat.</p>
            )}
            <Field id="code" label="6-digit code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required autoFocus value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} />
            <button className="btn pri" disabled={disabled}>{busy ? 'Checking…' : 'Continue'}</button>
            <p className="small muted">Lost your authenticator? Ask another WorkBeat admin to reset your authenticator.</p>
          </form>
        )}

        {step.kind === 'forgot' && (
          <form className="stack" onSubmit={submitForgot}>
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
