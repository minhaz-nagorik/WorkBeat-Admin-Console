'use client';
// Custom domains (staff-domains, A17). A company admin adds the domain; staff check its TXT record by hand,
// then approve or reject it. Only an approved (active) domain opens the dashboard.
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { when } from '@/lib/time';
import { useList } from '@/components/list';
import { ConfirmButton, Modal } from '@/components/confirm';
import { type Companies, type Company } from '@/components/staff/common';

const PILL = { pending: 'p-warn', active: 'p-ok', failed: 'p-bad' } as const;
type Records = { domain: string; status: 'pending' | 'active' | 'failed'; cname_target: string; txt_name: string; txt_value: string };

async function review(c: Company, domain: string, status: 'active' | 'failed') {
  return call<Records>('PATCH', `/v1/staff/companies/${c.id}/custom-domain`, { domain, status });
}

export default function StaffDomains() {
  const s = useData<Companies>('/v1/staff/companies');
  const rows = (s.data?.items ?? []).filter((c) => c.custom_domain);
  const L = useList(rows, (c) => `${c.custom_domain} ${c.name}`);
  const [checking, setChecking] = useState<Company | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const done = (ok: boolean, text: string) => { setChecking(null); setNote({ ok, text }); s.reload(); };

  async function deactivate(c: Company) {
    const r = await review(c, c.custom_domain!, 'failed');
    done(r.ok, r.ok ? `${c.custom_domain} no longer opens ${c.name}'s dashboard.` : message(r.status, r.err.code));
  }

  return (
    <>
      <PageHead title="Custom domains" sub="Domains companies have added. A domain works only after you approve it." />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <div className="card stack">
        <div className="toolbar">{L.search('Search domains or companies')}</div>
        <Loaded s={s}>{() => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Domain</th><th>Company</th><th>Status</th><th>Reviewed (UTC)</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={5} className="muted">{rows.length ? 'No domain matches.' : 'No company has a custom domain yet.'}</td></tr>
                    : L.rows.map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.custom_domain}</td>
                        <td>{c.name}</td>
                        <td><span className={`pill ${c.custom_domain_status ? PILL[c.custom_domain_status] : ''}`}>{label('domainStatus', c.custom_domain_status)}</span></td>
                        <td className="small">{c.custom_domain_checked_at ? when(c.custom_domain_checked_at, 'UTC') : 'Not reviewed yet'}</td>
                        <td>
                          {c.custom_domain_status === 'active'
                            ? <ConfirmButton label="Deactivate" question={`Deactivate ${c.custom_domain}? ${c.name}'s team can no longer open the dashboard at this address.`} onConfirm={() => deactivate(c)} />
                            : <button className="btn sm" onClick={() => setChecking(c)}>Check and approve</button>}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>
        <p className="small muted">Before approving, look up the domain&apos;s TXT record and make sure it shows the expected value. That proves the company controls the domain.</p>
      </div>
      <CheckDialog c={checking} onClose={() => setChecking(null)} onDone={done} />
    </>
  );
}

function CheckDialog({ c, onClose, onDone }: { c: Company | null; onClose: () => void; onDone: (ok: boolean, text: string) => void }) {
  const d = useData<Records>(c ? `/v1/staff/companies/${c.id}/custom-domain` : null);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  useEffect(() => setErr(''), [c]);

  async function decide(status: 'active' | 'failed') {
    if (!c || !d.data) return;
    setBusy(true);
    const r = await review(c, d.data.domain, status);
    setBusy(false);
    if (r.ok) return onDone(true, status === 'active' ? `${d.data.domain} is approved. ${c.name}'s team can open the dashboard there.` : `${d.data.domain} was not approved.`);
    setErr(r.status === 409 ? 'The company changed or removed this domain. Close and check again.' : message(r.status, r.err.code));
  }

  return (
    <Modal title={c ? `Check ${c.custom_domain}` : 'Check domain'} open={!!c} onClose={onClose}>
      {c && (
        <Loaded s={d} rows={3}>{(rec) => (
          <div className="stack">
            <p className="small">The TXT record must exist and hold this value:</p>
            <div className="tablewrap">
              <table>
                <tbody>
                  <tr><th scope="row">Name</th><td className="mono">{rec.txt_name}</td></tr>
                  <tr><th scope="row">Value</th><td className="mono">{rec.txt_value}</td></tr>
                </tbody>
              </table>
            </div>
            <p className="small">Check it in a terminal with <code className="mono">dig +short TXT {rec.txt_name}</code>, or with any online DNS lookup.</p>
            {err && <div className="err" role="alert">{err}</div>}
            <div className="mf">
              <button type="button" className="btn" onClick={onClose}>Cancel</button>
              <button type="button" className="btn danger" disabled={busy} onClick={() => decide('failed')}>Reject</button>
              <button type="button" className="btn pri" disabled={busy} onClick={() => decide('active')}>Approve</button>
            </div>
          </div>
        )}</Loaded>
      )}
    </Modal>
  );
}
