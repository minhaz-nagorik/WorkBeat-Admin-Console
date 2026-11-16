'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import type { CompanyStatus } from '@/lib/types';

// GET /v1/staff/companies row (staff-api.md). No employee, device or activity field exists (rule 3).
export type Company = {
  id: string; name: string; slug: string; plan: 'starter' | 'growth' | 'enterprise';
  seat_limit: number | null; seats_used: number; screenshot_tier: string;
  status: CompanyStatus; suspended_reason: 'payment_failed' | 'staff' | null;
  custom_domain: string | null; custom_domain_status: 'pending' | 'active' | 'failed' | null;
  custom_domain_checked_at: string | null; trial_ends_at: string | null; created_at: string;
  mrr_estimate: number; key_last4: string; expired_blocking_grace_days: number;
};
export type Companies = { items: Company[]; totals: { companies: number; seats_used: number; mrr_estimate: number; suspended: number } };

/** The data-boundary notice every staff page opens with (D41). */
export const Boundary = () => (
  <div className="notice info"><div><b>Internal console.</b> WorkBeat staff can manage companies, licences and plans. Employee names, activity, URLs and screenshots are never visible here.</div></div>
);

/** `value`, settled for `ms` (search sent as `q` without a call per keystroke). */
export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

export const seats = (c: Company) => `${c.seats_used.toLocaleString('en-US')} / ${c.seat_limit === null ? 'Unlimited' : c.seat_limit.toLocaleString('en-US')}`;
export const usd = (n: number) => `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function StatusPill({ c }: { c: Company }) {
  const cls = c.status === 'active' ? 'p-ok' : c.status === 'trial' ? 'p-info' : 'p-bad';
  return (
    <span className={`pill ${cls}`}>{label('companyStatus', c.status)}
      {c.status === 'suspended' && c.suspended_reason && <> · {label('suspendedReason', c.suspended_reason)}</>}
    </span>
  );
}

/** "Enterprise seats": plan enterprise with a seat limit, empty = unlimited (D43). */
export function SeatsDialog({ c, onClose, onSaved }: { c: Company | null; onClose: () => void; onSaved: (c: Company) => void }) {
  const [limit, setLimit] = useState('');
  const [err, setErr] = useState<{ limit?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (c) { setLimit(c.seat_limit === null ? '' : String(c.seat_limit)); setErr({}); } }, [c]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!c) return;
    const n = limit.trim() === '' ? null : Number(limit);
    if (n !== null && (!Number.isInteger(n) || n < 1)) return setErr({ limit: 'Enter a whole number of seats, or leave empty for unlimited.' });
    setBusy(true); setErr({});
    const r = await call<Company>('PATCH', `/v1/staff/companies/${c.id}/license`, { plan: 'enterprise', seat_limit: n });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    if (r.status === 409) return setErr({ limit: `The limit can't go below the ${c.seats_used} seats in use.` });
    if (r.status === 422 || r.status === 400) return setErr({ limit: 'Enter a whole number of seats, or leave empty for unlimited.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={c ? `Enterprise seats for ${c.name}` : 'Enterprise seats'} open={!!c} onClose={onClose}>
      {c && (
        <form method="post" className="stack" onSubmit={submit}>
          <p className="small">Now on {label('plan', c.plan)}, {c.seats_used} seats in use.{c.plan !== 'enterprise' && ' Saving moves this company to Enterprise.'}</p>
          <Field id="seat-limit" label="Seat limit" type="number" min={1} step={1} value={limit} error={err.limit}
            hint="Leave empty for unlimited seats." onChange={(e) => setLimit(e.target.value)} />
          {err.form && <div className="err" role="alert">{err.form}</div>}
          <div className="mf">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Set Enterprise seats'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
