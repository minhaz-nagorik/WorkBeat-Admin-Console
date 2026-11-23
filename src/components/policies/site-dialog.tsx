'use client';
// Add a private site: a company's own list (/v1/sensitive-domains) or WorkBeat's list for every company (A19).
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { isPending } from '@/components/pending';
import { Modal } from '@/components/confirm';
import { Field } from '@/components/form';

export type Site = { id: string; pattern: string; is_default?: boolean; source?: 'company' | 'workbeat'; created_at: string; created_by_name?: string | null };

export function SiteDialog({ open, path = '/v1/sensitive-domains', intro, onClose, onSaved, onSent }: {
  open: boolean; path?: string; intro?: string; onClose: () => void; onSaved: (s: Site) => void; onSent?: () => void;
}) {
  const [pattern, setPattern] = useState('');
  const [err, setErr] = useState<{ pattern?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setPattern(''); setErr({}); } }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call<Site>('POST', path, { pattern: pattern.trim() });
    setBusy(false);
    if (isPending(r)) return onSent?.();
    if (r.ok) return onSaved(r.data);
    if (r.status === 409) return setErr({ pattern: 'That site is already on the list.' });
    if (r.status === 422 || r.status === 400) return setErr({ pattern: 'Type just the website, like citybank.com.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Add a private site" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <p className="small">{intro ?? 'WorkBeat will never record visits to this site, and screenshots pause while it is open. Use it for banking, health or personal sites.'}</p>
        <Field id="sens-new" type="text" label="Website address" required maxLength={253} autoFocus spellCheck={false} placeholder="citybank.com"
          hint="Just the website name. It also covers its subdomains, like online.citybank.com."
          value={pattern} error={err.pattern} onChange={(e) => setPattern(e.target.value)} />
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Adding…' : 'Add site'}</button>
        </div>
      </form>
    </Modal>
  );
}
