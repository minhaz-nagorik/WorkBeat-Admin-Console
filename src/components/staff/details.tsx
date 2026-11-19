'use client';
// Company name and data retention, which only WorkBeat staff set (B29). Lowering retention deletes data, so it is confirmed first (A7).
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { Confirm, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import type { Company } from './common';

const RETENTION_CHOICES = [30, 60, 90]; // B13: the only values the API accepts

export function DetailsDialog({ c, onClose, onSaved }: { c: Company | null; onClose: () => void; onSaved: (c: Company) => void }) {
  const [name, setName] = useState('');
  const [days, setDays] = useState('90');
  const [err, setErr] = useState<{ name?: string; form?: string }>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (c) { setName(c.name); setDays(String(c.data_retention_days ?? 90)); setErr({}); setConfirming(false); } }, [c]);

  async function save() {
    if (!c) return;
    setConfirming(false); setBusy(true); setErr({});
    const r = await call<Company>('PATCH', `/v1/staff/companies/${c.id}`, { name: name.trim(), data_retention_days: +days });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    setErr(r.status === 422 ? { name: 'Use 1 to 100 characters.' } : { form: message(r.status, r.err.code) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault(); if (!c) return;
    if (!name.trim() || name.trim().length > 100) return setErr({ name: 'Use 1 to 100 characters.' });
    if (c.data_retention_days && +days < c.data_retention_days) return setConfirming(true);
    save();
  }

  return (
    <Modal title={c ? `Details of ${c.name}` : 'Company details'} open={!!c} onClose={onClose}>
      {c && (
        <form method="post" className="stack" onSubmit={submit} noValidate>
          <Field id="co-name" label="Company name" required maxLength={100} value={name} error={err.name} onChange={(e) => setName(e.target.value)}
            hint={`The dashboard address stays ${c.slug}.workbeat.io.`} />
          <div className="field">
            <label htmlFor="co-ret">Keep activity data for</label>
            <select id="co-ret" style={{ maxWidth: 200 }} value={days} onChange={(e) => setDays(e.target.value)} aria-describedby="co-ret-hint">
              {RETENTION_CHOICES.map((d) => <option key={d} value={d}>{d} days{d === 90 ? ' (default)' : ''}</option>)}
            </select>
            <span className="hint" id="co-ret-hint">Older activity and screenshots are deleted every night.</span>
          </div>
          {err.form && <div className="err" role="alert">{err.form}</div>}
          {confirming ? (
            <Confirm question={`Keep ${c.name}'s data for ${days} days? Their activity and screenshots older than ${days} days are deleted tonight and can't be recovered.`}
              action="Save and delete older data" onConfirm={save} onCancel={() => setConfirming(false)} />
          ) : (
            <div className="mf">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
            </div>
          )}
        </form>
      )}
    </Modal>
  );
}
