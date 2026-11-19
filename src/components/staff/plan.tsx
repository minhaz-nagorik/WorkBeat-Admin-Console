'use client';
// Staff set a company's plan, seats, screenshot plan and status (backend B30). Lowering the screenshot plan or
// suspending / expiring a company changes what its computers do, so those are confirmed first (A7).
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label, options } from '@/lib/labels';
import { Confirm, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import type { CompanyStatus } from '@/lib/types';
import type { Company } from './common';

const TIER_ORDER = ['off', 'light', 'standard', 'intensive'];
const TIER_EVERY: Record<string, number> = { light: 60, standard: 30, intensive: 10 };
const SEATS_ERR = 'Enter a whole number of seats, or leave empty for unlimited (Enterprise only).';

/** "Plan": plan, seat limit (empty = unlimited, Enterprise only) and screenshot plan. */
export function PlanDialog({ c, onClose, onSaved }: { c: Company | null; onClose: () => void; onSaved: (c: Company) => void }) {
  const [plan, setPlan] = useState('growth');
  const [limit, setLimit] = useState('');
  const [tier, setTier] = useState('off');
  const [err, setErr] = useState<{ limit?: string; form?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (c) { setPlan(c.plan); setLimit(c.seat_limit === null ? '' : String(c.seat_limit)); setTier(c.screenshot_tier); setErr({}); setConfirming(false); }
  }, [c]);
  if (!c) return <Modal title="Plan" open={false} onClose={onClose}>{null}</Modal>;
  const lower = TIER_ORDER.indexOf(tier) < TIER_ORDER.indexOf(c.screenshot_tier);

  async function save() {
    if (!c) return;
    setConfirming(false); setBusy(true); setErr({});
    const r = await call<Company>('PATCH', `/v1/staff/companies/${c.id}/license`,
      { plan, seat_limit: limit.trim() === '' ? null : Number(limit), screenshot_tier: tier });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    if (r.status === 409) return setErr({ limit: `The limit can't go below the ${c.seats_used} seats in use.` });
    if (r.status === 422 || r.status === 400) return setErr({ limit: SEATS_ERR });
    setErr({ form: message(r.status, r.err.code) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const n = limit.trim() === '' ? null : Number(limit);
    if (n === null ? plan !== 'enterprise' : !Number.isInteger(n) || n < 1) return setErr({ limit: SEATS_ERR });
    if (n !== null && n < c!.seats_used) return setErr({ limit: `The limit can't go below the ${c!.seats_used} seats in use.` });
    if (lower) return setConfirming(true);
    save();
  }

  const slowNote = tier === 'off' ? 'Screenshots stop for every employee.'
    : `Employees set to more often than every ${TIER_EVERY[tier]} minutes are slowed to every ${TIER_EVERY[tier]} minutes.`;
  return (
    <Modal title={`Plan for ${c.name}`} open onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <p className="small">{c.seats_used} seats in use.</p>
        <div className="field">
          <label htmlFor="pl-plan">Plan</label>
          <select id="pl-plan" style={{ maxWidth: 220 }} value={plan} onChange={(e) => setPlan(e.target.value)}>
            {options('plan').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
        <Field id="pl-seats" label="Seat limit" type="number" min={1} step={1} value={limit} error={err.limit}
          hint={plan === 'enterprise' ? 'Leave empty for unlimited seats.' : 'A whole number of seats.'} onChange={(e) => setLimit(e.target.value)} />
        <div className="field">
          <label htmlFor="pl-tier">Screenshot plan</label>
          <select id="pl-tier" style={{ maxWidth: 260 }} value={tier} onChange={(e) => setTier(e.target.value)} aria-describedby="pl-tier-hint">
            {options('tier').map(([v, l]) => <option key={v} value={v}>{l}{TIER_EVERY[v] ? ` (as often as every ${TIER_EVERY[v]} minutes)` : ' (no screenshots)'}</option>)}
          </select>
          <span className="hint" id="pl-tier-hint">Computers pick up a change within 30 minutes.</span>
        </div>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        {confirming ? (
          <Confirm question={`Lower the screenshot plan to ${label('tier', tier)}? ${slowNote}`} action="Lower the screenshot plan"
            onConfirm={save} onCancel={() => setConfirming(false)} />
        ) : (
          <div className="mf">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </form>
    </Modal>
  );
}

const STATUS_NOTE: Record<CompanyStatus, string> = {
  trial: 'The company works normally until the trial ends.',
  active: 'The company works normally.',
  suspended: 'Every computer stops collecting and shows the employee a notice.',
  expired: 'Computers stop collecting. Website blocking continues for the grace period, then stops.',
};

/** "Status": trial (with days), active, suspended or expired. */
export function StatusDialog({ c, onClose, onSaved }: { c: Company | null; onClose: () => void; onSaved: (c: Company) => void }) {
  const [status, setStatus] = useState<CompanyStatus>('active');
  const [days, setDays] = useState('14');
  const [err, setErr] = useState<{ days?: string; form?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (c) { setStatus(c.status); setDays('14'); setErr({}); setConfirming(false); } }, [c]);
  if (!c) return <Modal title="Status" open={false} onClose={onClose}>{null}</Modal>;

  async function save() {
    if (!c) return;
    setConfirming(false); setBusy(true); setErr({});
    const r = await call<Company>('PATCH', `/v1/staff/companies/${c.id}`, { status, ...(status === 'trial' && { trial_days: Number(days) }) });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    if (r.status === 422) return setErr({ days: 'Enter a whole number of days from 1 to 90.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const okDays = /^\d+$/.test(days.trim()) && +days >= 1 && +days <= 90;
    if (status === 'trial' && !okDays) return setErr({ days: 'Enter a whole number of days from 1 to 90.' });
    if ((status === 'suspended' || status === 'expired') && status !== c!.status) return setConfirming(true);
    save();
  }

  return (
    <Modal title={`Status of ${c.name}`} open onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <div className="field">
          <label htmlFor="st-status">Status</label>
          <select id="st-status" style={{ maxWidth: 220 }} value={status} onChange={(e) => setStatus(e.target.value as CompanyStatus)} aria-describedby="st-hint">
            {options('companyStatus').map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <span className="hint" id="st-hint">{STATUS_NOTE[status]}</span>
        </div>
        {status === 'trial' && (
          <Field id="st-days" label="Trial length (days from today)" type="number" min={1} max={90} step={1} value={days} error={err.days}
            hint="1 to 90." onChange={(e) => setDays(e.target.value)} />
        )}
        {err.form && <div className="err" role="alert">{err.form}</div>}
        {confirming ? (
          <Confirm question={`Set ${c.name} to ${label('companyStatus', status)}? ${STATUS_NOTE[status]}`} action={`Set to ${label('companyStatus', status)}`}
            onConfirm={save} onCancel={() => setConfirming(false)} />
        ) : (
          <div className="mf">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        )}
      </form>
    </Modal>
  );
}
