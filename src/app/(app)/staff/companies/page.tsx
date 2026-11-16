'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { dateOnly } from '@/lib/time';
import { useList } from '@/components/list';
import { ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import { Boundary, SeatsDialog, StatusPill, seats, usd, useDebounced, type Companies, type Company } from '@/components/staff/common';

const FILTERS = [['', 'All'], ['trial', 'Trial'], ['active', 'Active'], ['suspended', 'Suspended'], ['expired', 'Expired']] as const;

export default function StaffCompanies() {
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const qs = new URLSearchParams({ ...(status && { status }), ...(dq && { q: dq }) }).toString();
  const s = useData<Companies>(`/v1/staff/companies${qs ? `?${qs}` : ''}`);
  const L = useList(s.data?.items ?? [], () => '');
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [seatsFor, setSeatsFor] = useState<Company | null>(null);
  const [graceFor, setGraceFor] = useState<Company | null>(null);

  async function act(c: Company, kind: 'suspend' | 'restore') {
    const r = await call<Company>('POST', `/v1/staff/companies/${c.id}/${kind}`);
    if (r.ok) setNote({ ok: true, text: kind === 'suspend' ? `${c.name} is suspended. Its computers stop collecting.` : `${c.name} is restored.` });
    else setNote({ ok: false, text: r.status === 409 ? "An expired company can't be suspended or restored." : message(r.status, r.err.code) });
    s.reload();
  }
  const saved = (text: string) => { setSeatsFor(null); setGraceFor(null); setNote({ ok: true, text }); s.reload(); };

  return (
    <>
      <PageHead title="Companies" sub="Every customer account." />
      <Boundary />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      {s.data && (
        <div className="grid g4">
          <div className="card stat"><span className="label">Companies</span><span className="v">{s.data.totals.companies.toLocaleString('en-US')}</span></div>
          <div className="card stat"><span className="label">Seats in use</span><span className="v">{s.data.totals.seats_used.toLocaleString('en-US')}</span></div>
          <div className="card stat"><span className="label">Monthly revenue</span><span className="v">{usd(s.data.totals.mrr_estimate)}</span><span className="s">Estimate. Invoices are in Stripe.</span></div>
          <div className="card stat"><span className="label">Suspended</span><span className="v">{s.data.totals.suspended.toLocaleString('en-US')}</span></div>
        </div>
      )}
      <div className="card stack">
        <div className="toolbar">
          <input type="search" className="search" placeholder="Search name or address" aria-label="Search name or address" value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="seg" role="group" aria-label="Status">
            {FILTERS.map(([v, l]) => <button key={v} className={status === v ? 'on' : ''} aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>)}
          </div>
        </div>
        <Loaded s={s}>{(d) => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Company</th><th>Plan</th><th>Seats</th><th>Screenshots</th><th>Monthly (est.)</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={7} className="muted">{d.items.length || !qs ? 'No companies yet.' : 'No company matches.'}</td></tr>
                    : L.rows.map((c) => (
                      <tr key={c.id}>
                        <td>{c.name}<div className="small muted"><span className="mono">{c.slug}</span> · since {dateOnly(c.created_at, 'UTC')} (UTC)</div></td>
                        <td>{label('plan', c.plan)}</td>
                        <td className="num">{seats(c)}</td>
                        <td>{label('tier', c.screenshot_tier)}</td>
                        <td className="num">{usd(c.mrr_estimate)}</td>
                        <td><StatusPill c={c} /></td>
                        <td><div className="row">
                          {c.status === 'suspended'
                            ? <ConfirmButton label="Restore" question={`Restore ${c.name}? Its computers start collecting again.`} onConfirm={() => act(c, 'restore')} />
                            : c.status !== 'expired' && <ConfirmButton label="Suspend" question={`Suspend ${c.name}? Every computer stops collecting and shows the employee a notice.`} onConfirm={() => act(c, 'suspend')} />}
                          <button className="btn sm" onClick={() => setSeatsFor(c)}>Enterprise seats</button>
                          <button className="btn sm" onClick={() => setGraceFor(c)}>Grace period</button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>
        <p className="small muted">Suspending a company stops every one of its computers collecting, and each shows the employee a notice. Times are in UTC.</p>
      </div>
      <SeatsDialog c={seatsFor} onClose={() => setSeatsFor(null)} onSaved={(c) => saved(`${c.name} is on Enterprise with ${seats(c)} seats.`)} />
      <GraceDialog c={graceFor} onClose={() => setGraceFor(null)} onSaved={(c) => saved(`${c.name}: blocking grace period set to ${c.expired_blocking_grace_days} days.`)} />
    </>
  );
}

function GraceDialog({ c, onClose, onSaved }: { c: Company | null; onClose: () => void; onSaved: (c: Company) => void }) {
  const [days, setDays] = useState('');
  const [err, setErr] = useState<{ days?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (c) { setDays(String(c.expired_blocking_grace_days ?? 30)); setErr({}); } }, [c]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); if (!c) return;
    const n = Number(days);
    if (days.trim() === '' || !Number.isInteger(n) || n < 0 || n > 365) return setErr({ days: 'Enter a whole number from 0 to 365.' });
    setBusy(true); setErr({});
    const r = await call<Company>('PATCH', `/v1/staff/companies/${c.id}`, { expired_blocking_grace_days: n });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    if (r.status === 422 || r.status === 400) return setErr({ days: 'Enter a whole number from 0 to 365.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={c ? `Grace period for ${c.name}` : 'Grace period'} open={!!c} onClose={onClose}>
      {c && (
        <form method="post" className="stack" onSubmit={submit}>
          <Field id="grace-days" label="Days of website blocking after the licence expires" type="number" min={0} max={365} step={1} required
            value={days} error={err.days} hint="0 to 365. The default is 30." onChange={(e) => setDays(e.target.value)} />
          <p className="small muted">After this many days, an expired company&apos;s computers stop blocking websites. The change applies at once.</p>
          {err.form && <div className="err" role="alert">{err.form}</div>}
          <div className="mf">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
