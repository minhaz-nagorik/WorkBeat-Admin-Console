'use client';
import { useEffect, useState } from 'react';
import { label } from '@/lib/labels';
import type { CompanyStatus } from '@/lib/types';

// GET /v1/staff/companies row (staff-api.md). No employee, device or activity field exists (rule 3).
export type Company = {
  id: string; name: string; slug: string; plan: 'starter' | 'growth' | 'enterprise';
  seat_limit: number | null; seats_used: number; screenshot_tier: string;
  status: CompanyStatus; suspended_reason: 'payment_failed' | 'staff' | null;
  custom_domain: string | null; custom_domain_status: 'pending' | 'active' | 'failed' | null;
  custom_domain_checked_at: string | null; trial_ends_at: string | null; created_at: string;
  mrr_estimate: number; key_last4: string; expired_blocking_grace_days: number;
  data_retention_days?: number; // set by staff only (B29); missing from an older API
};
export type Companies = { items: Company[]; totals: { companies: number; seats_used: number; mrr_estimate: number; suspended: number } };

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
