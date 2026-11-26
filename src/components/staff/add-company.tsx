'use client';
import { useEffect, useMemo, useState } from 'react';
import { call, message } from '@/lib/client';
import { label, options } from '@/lib/labels';
import { Modal } from '@/components/confirm';
import { Combo, Field } from '@/components/form';
import type { Company } from './common';

// POST /v1/staff/companies (backend round 5): the company, its licence and one or two Company Admin invitations.
type Form = {
  name: string; slug: string; plan: string; seats: string; unlimited: boolean; screenshot_tier: string;
  status: 'trial' | 'active'; trial_days: string; timezone: string; data_retention_days: string; admin_email: string; admin_email_2: string;
};
const EMPTY: Form = {
  name: '', slug: '', plan: 'growth', seats: '10', unlimited: false, screenshot_tier: 'standard',
  status: 'trial', trial_days: '14', timezone: 'UTC', data_retention_days: '90', admin_email: '', admin_email_2: '',
};
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/; // companies.slug rule: 3–32, no double dash
const slugOf = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').slice(0, 32).replace(/^-+|-+$/g, '');
const whole = (v: string, min: number, max: number) => /^\d+$/.test(v) && +v >= min && +v <= max;

/** Client-side checks; the API is the real control and its 409/422 land beside the same fields. */
export function check(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim() || f.name.trim().length > 100) e.name = 'Enter the company name (up to 100 characters).';
  if (!SLUG.test(f.slug) || f.slug.length < 3 || f.slug.length > 32) e.slug = 'Use 3 to 32 lower-case letters or digits, with single dashes between words.';
  if (!(f.unlimited && f.plan === 'enterprise') && !whole(f.seats, 1, 100000)) e.seats = 'Enter a number of seats, 1 or more.';
  if (f.status === 'trial' && !whole(f.trial_days, 1, 90)) e.trial_days = 'Use 1 to 90 days.';
  if (!['30', '60', '90'].includes(f.data_retention_days)) e.data_retention_days = 'Pick 30, 60 or 90 days.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.admin_email.trim())) e.admin_email = 'Enter the Company Admin’s email.';
  const second = f.admin_email_2.trim();
  if (second && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(second)) e.admin_email_2 = 'Enter a valid email, or leave it empty.';
  else if (second && second.toLowerCase() === f.admin_email.trim().toLowerCase()) e.admin_email_2 = 'Use a different email from the first Company Admin.';
  return e;
}

export function AddCompanyDialog({ open, onClose, onCreated }: {
  open: boolean; onClose: () => void; onCreated: (c: Company, email: string) => void;
}) {
  const [f, setF] = useState<Form>(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [err, setErr] = useState<Partial<Record<keyof Form | 'form', string>>>({});
  const [busy, setBusy] = useState(false);
  const zones = useMemo(() => { try { return [...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])]; } catch { return ['UTC']; } }, []);
  useEffect(() => { if (open) { setF(EMPTY); setSlugTouched(false); setErr({}); } }, [open]);
  const set = (k: keyof Form, v: string | boolean) => setF((p) => ({ ...p, [k]: v, ...(k === 'name' && !slugTouched ? { slug: slugOf(String(v)) } : {}) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const bad = check(f); setErr(bad); if (Object.keys(bad).length) return;
    setBusy(true);
    const unlimited = f.unlimited && f.plan === 'enterprise';
    const r = await call<{ company: Company; invitation: { email: string }; invitations?: { email: string }[] }>('POST', '/v1/staff/companies', {
      name: f.name.trim(), slug: f.slug, plan: f.plan, seat_limit: unlimited ? null : +f.seats, screenshot_tier: f.screenshot_tier,
      status: f.status, ...(f.status === 'trial' && { trial_days: +f.trial_days }), timezone: f.timezone,
      data_retention_days: +f.data_retention_days, admin_email: f.admin_email.trim(), admin_email_2: f.admin_email_2.trim() || null,
    });
    setBusy(false);
    if (r.ok) return onCreated(r.data.company, (r.data.invitations ?? [r.data.invitation]).map((i) => i.email).join(' and '));
    const fields = r.err.fields ?? [];
    if (r.status === 409) return setErr(fields.includes('admin_email') || fields.includes('admin_email_2')
      ? { [fields.includes('admin_email_2') ? 'admin_email_2' : 'admin_email']: 'This email already has an account or an open invitation.' }
      : { slug: 'This address is already taken.' });
    if (r.status === 422 && fields.length) {
      const e2: Partial<Record<keyof Form, string>> = {};
      for (const k of fields) e2[(k === 'seat_limit' ? 'seats' : k) as keyof Form] = 'Check this value.';
      return setErr(e2);
    }
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Add company" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <div className="fgrid">
          <Field id="nc-name" label="Company name" required maxLength={100} autoFocus value={f.name} error={err.name} onChange={(e) => set('name', e.target.value)} />
          <Field id="nc-slug" label="Address" required maxLength={32} spellCheck={false} value={f.slug} error={err.slug}
            hint={`${f.slug || 'name'}.tryworkbeat.com`} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()); }} />

          <div className="field"><label htmlFor="nc-plan">Plan</label>
            <select id="nc-plan" value={f.plan} onChange={(e) => set('plan', e.target.value)}>
              {options('plan').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          <div className="field">
            <label htmlFor="nc-seats">Seats</label>
            <input id="nc-seats" type="text" inputMode="numeric" disabled={f.unlimited && f.plan === 'enterprise'} value={f.seats}
              aria-invalid={!!err.seats} onChange={(e) => set('seats', e.target.value)} />
            {err.seats ? <span className="err" role="alert">{err.seats}</span>
              : f.plan === 'enterprise'
                ? <label className="row small" style={{ gap: 6 }}><input type="checkbox" checked={f.unlimited} onChange={(e) => set('unlimited', e.target.checked)} /> Unlimited</label>
                : <span className="hint">Unlimited only on Enterprise</span>}
          </div>

          <div className="field"><label htmlFor="nc-tier">Screenshots</label>
            <select id="nc-tier" value={f.screenshot_tier} onChange={(e) => set('screenshot_tier', e.target.value)}>
              {options('tier').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          <div className="field"><label htmlFor="nc-status">Start as</label>
            <select id="nc-status" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="trial">{label('companyStatus', 'trial')}</option>
              <option value="active">{label('companyStatus', 'active')}</option>
            </select></div>

          <Field id="nc-trial" label="Trial days" inputMode="numeric" disabled={f.status !== 'trial'} value={f.trial_days} error={err.trial_days}
            hint={f.status === 'trial' ? '1 to 90' : 'Only for a trial'} onChange={(e) => set('trial_days', e.target.value)} />
          <Combo id="nc-tz" label="Time zone" options={zones} value={f.timezone} error={err.timezone} hint="Pick from the list or type to search"
            onChange={(v) => set('timezone', v)} />

          <div className="field"><label htmlFor="nc-ret">Keep activity for</label>
            <select id="nc-ret" value={f.data_retention_days} onChange={(e) => set('data_retention_days', e.target.value)}
              aria-invalid={!!err.data_retention_days} aria-describedby={err.data_retention_days ? 'nc-ret-err' : undefined}>
              {[30, 60, 90].map((d) => <option key={d} value={String(d)}>{d} days{d === 90 ? ' (default)' : ''}</option>)}
            </select>
            {err.data_retention_days && <span className="err" id="nc-ret-err" role="alert">{err.data_retention_days}</span>}</div>
          <div aria-hidden="true" />

          <div className="span2">
            <Field id="nc-admin" label="Company Admin email" type="email" required maxLength={254} value={f.admin_email} error={err.admin_email}
              hint="We email the licence key and a link to create their account to this address." onChange={(e) => set('admin_email', e.target.value)} />
          </div>
          <div className="span2">
            <Field id="nc-admin-2" label="Second Company Admin email (optional)" type="email" maxLength={254} value={f.admin_email_2} error={err.admin_email_2}
              hint="With two Company Admins, each one’s changes wait for the other’s approval." onChange={(e) => set('admin_email_2', e.target.value)} />
          </div>
        </div>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Creating…' : 'Create company'}</button>
        </div>
      </form>
    </Modal>
  );
}
