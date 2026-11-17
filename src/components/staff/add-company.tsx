'use client';
import { useEffect, useMemo, useState } from 'react';
import { call, message } from '@/lib/client';
import { label, options } from '@/lib/labels';
import { Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import type { Company } from './common';

// POST /v1/staff/companies (backend round 5): the company, its licence and a Company Admin invitation.
type Form = {
  name: string; slug: string; plan: string; seats: string; unlimited: boolean; screenshot_tier: string;
  status: 'trial' | 'active'; trial_days: string; timezone: string; data_retention_days: string; admin_email: string;
};
const EMPTY: Form = {
  name: '', slug: '', plan: 'growth', seats: '10', unlimited: false, screenshot_tier: 'standard',
  status: 'trial', trial_days: '14', timezone: 'UTC', data_retention_days: '90', admin_email: '',
};
const SLUG = /^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/;
const slugOf = (name: string) => name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
const whole = (v: string, min: number, max: number) => /^\d+$/.test(v) && +v >= min && +v <= max;

/** Client-side checks; the API is the real control and its 409/422 land beside the same fields. */
export function check(f: Form): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim() || f.name.trim().length > 100) e.name = 'Enter the company name (up to 100 characters).';
  if (!SLUG.test(f.slug)) e.slug = 'Use 3 to 40 lower-case letters, digits or dashes, not starting or ending with a dash.';
  if (!(f.unlimited && f.plan === 'enterprise') && !whole(f.seats, 1, 100000)) e.seats = 'Enter a number of seats, 1 or more.';
  if (f.status === 'trial' && !whole(f.trial_days, 1, 90)) e.trial_days = 'Use 1 to 90 days.';
  if (!whole(f.data_retention_days, 1, 365)) e.data_retention_days = 'Use 1 to 365 days.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.admin_email.trim())) e.admin_email = 'Enter the Company Admin’s email.';
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
    const r = await call<{ company: Company; invitation: { email: string } }>('POST', '/v1/staff/companies', {
      name: f.name.trim(), slug: f.slug, plan: f.plan, seat_limit: unlimited ? null : +f.seats, screenshot_tier: f.screenshot_tier,
      status: f.status, ...(f.status === 'trial' && { trial_days: +f.trial_days }), timezone: f.timezone,
      data_retention_days: +f.data_retention_days, admin_email: f.admin_email.trim(),
    });
    setBusy(false);
    if (r.ok) return onCreated(r.data.company, r.data.invitation.email);
    const fields = r.err.fields ?? [];
    if (r.status === 409) return setErr(fields.includes('admin_email')
      ? { admin_email: 'This email already has an account or an open invitation.' }
      : { slug: 'This address is already taken.' });
    if (r.status === 422 && fields.length) {
      const e2: Partial<Record<keyof Form, string>> = {};
      for (const k of fields) e2[(k === 'seat_limit' ? 'seats' : k) as keyof Form] = 'Check this value.';
      return setErr(e2);
    }
    setErr({ form: r.status === 404 && !r.err.code ? 'Creating companies isn’t available yet.' : message(r.status, r.err.code) });
  }

  return (
    <Modal title="Add company" open={open} onClose={onClose} wide>
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <div className="form">
          <Field id="nc-name" label="Company name" required maxLength={100} autoFocus value={f.name} error={err.name} onChange={(e) => set('name', e.target.value)} />
          <Field id="nc-slug" label="Address" required maxLength={40} spellCheck={false} value={f.slug} error={err.slug}
            hint={f.slug ? `${f.slug}.workbeat.io` : 'name.workbeat.io'} onChange={(e) => { setSlugTouched(true); set('slug', e.target.value.toLowerCase()); }} />
        </div>
        <div className="form">
          <div className="field"><label htmlFor="nc-plan">Plan</label>
            <select id="nc-plan" value={f.plan} onChange={(e) => set('plan', e.target.value)}>
              {options('plan').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
          <Field id="nc-seats" label="Seats" inputMode="numeric" disabled={f.unlimited && f.plan === 'enterprise'} value={f.seats} error={err.seats} onChange={(e) => set('seats', e.target.value)} />
          {f.plan === 'enterprise' && (
            <label className="row" style={{ gap: 8, alignSelf: 'end', paddingBottom: 8 }}>
              <input type="checkbox" checked={f.unlimited} onChange={(e) => set('unlimited', e.target.checked)} /> Unlimited seats
            </label>
          )}
          <div className="field"><label htmlFor="nc-tier">Screenshots</label>
            <select id="nc-tier" value={f.screenshot_tier} onChange={(e) => set('screenshot_tier', e.target.value)}>
              {options('tier').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
        </div>
        <div className="form">
          <div className="field"><label htmlFor="nc-status">Start as</label>
            <select id="nc-status" value={f.status} onChange={(e) => set('status', e.target.value)}>
              <option value="trial">{label('companyStatus', 'trial')}</option>
              <option value="active">{label('companyStatus', 'active')}</option>
            </select></div>
          {f.status === 'trial' && <Field id="nc-trial" label="Trial days" inputMode="numeric" value={f.trial_days} error={err.trial_days} hint="1 to 90" onChange={(e) => set('trial_days', e.target.value)} />}
          <div className="field"><label htmlFor="nc-tz">Time zone</label>
            <input id="nc-tz" type="text" list="nc-tz-list" value={f.timezone} onChange={(e) => set('timezone', e.target.value)} />
            <datalist id="nc-tz-list">{zones.map((z) => <option key={z} value={z} />)}</datalist>
            {err.timezone && <span className="err" role="alert">{err.timezone}</span>}</div>
          <Field id="nc-ret" label="Keep activity for (days)" inputMode="numeric" value={f.data_retention_days} error={err.data_retention_days} hint="1 to 365" onChange={(e) => set('data_retention_days', e.target.value)} />
        </div>
        <Field id="nc-admin" label="Company Admin email" type="email" required maxLength={254} value={f.admin_email} error={err.admin_email}
          hint="We email the licence key and a link to create their account to this address." onChange={(e) => set('admin_email', e.target.value)} />
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Creating…' : 'Create company'}</button>
        </div>
      </form>
    </Modal>
  );
}
