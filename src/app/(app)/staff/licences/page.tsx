'use client';
import { useState } from 'react';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { useList } from '@/components/list';
import { Modal } from '@/components/confirm';
import { SeatsDialog, StatusPill, seats, useDebounced, type Companies, type Company } from '@/components/staff/common';

const mask = (last4: string) => `WB-••••-••••-••••-${last4}`;

export default function StaffLicences() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const s = useData<Companies>(`/v1/staff/companies${dq ? `?q=${encodeURIComponent(dq)}` : ''}`);
  const L = useList(s.data?.items ?? [], () => '');
  const [seatsFor, setSeatsFor] = useState<Company | null>(null);
  const [reissue, setReissue] = useState<Company | null>(null);
  const [note, setNote] = useState<string | null>(null);

  return (
    <>
      <PageHead title="Licences" sub="One licence key per company. Seats belong to the company, not the key: a reissued key keeps every seat in use." />
      {note && <div className="notice ok" role="status">{note}</div>}
      <div className="card stack">
        <div className="toolbar">
          <input type="search" className="search" placeholder="Search company or last 4 of key" aria-label="Search company or last 4 of key" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <Loaded s={s}>{(d) => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Licence</th><th>Company</th><th>Seats</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={5} className="muted">{d.items.length || !dq ? 'No licences yet.' : 'No licence matches.'}</td></tr>
                    : L.rows.map((c) => (
                      <tr key={c.id}>
                        <td className="mono" aria-label={`Key ending ${c.key_last4}`}>{mask(c.key_last4)}</td>
                        <td>{c.name}</td>
                        <td className="num">{seats(c)}</td>
                        <td><StatusPill c={c} /></td>
                        <td><div className="row">
                          <button className="btn sm" onClick={() => setSeatsFor(c)}>Enterprise seats</button>
                          <button className="btn sm danger" onClick={() => setReissue(c)}>Reissue key</button>
                        </div></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>
      </div>
      <SeatsDialog c={seatsFor} onClose={() => setSeatsFor(null)} onSaved={(c) => { setSeatsFor(null); setNote(`${c.name} is on Enterprise with ${seats(c)} seats.`); s.reload(); }} />
      <ReissueDialog c={reissue} onClose={() => { setReissue(null); s.reload(); }} />
    </>
  );
}

/** Confirm, then show the new key once. The key lives only in this component's state (A6). */
function ReissueDialog({ c, onClose }: { c: Company | null; onClose: () => void }) {
  const [key, setKey] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const close = () => { setKey(null); setErr(null); setCopied(false); onClose(); };

  async function go() {
    if (!c) return;
    setBusy(true); setErr(null);
    const r = await call<{ key: string }>('POST', `/v1/staff/companies/${c.id}/license/reissue`);
    setBusy(false);
    if (r.ok) setKey(r.data.key); else setErr(message(r.status, r.err.code));
  }

  return (
    <Modal title={c ? `Reissue the key for ${c.name}` : 'Reissue key'} open={!!c} onClose={close}>
      {c && (key ? (
        <div className="stack">
          <p>The new key was emailed to {c.name}&apos;s Company Admins. It is shown only this once.</p>
          <div className="keybox row between"><span className="mono">{key}</span>
            <button className="btn sm" onClick={async () => { await navigator.clipboard.writeText(key); setCopied(true); }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <div className="mf"><button className="btn pri" onClick={close}>Done</button></div>
        </div>
      ) : (
        <div className="stack">
          <p>The current key (ending {c.key_last4}) stops working for new installs at once, and installs started with it but not finished are cancelled.</p>
          <p>Enrolled computers keep working, and the {seats(c)} seats in use stay in use on the new key.</p>
          {err && <div className="err" role="alert">{err}</div>}
          <div className="mf">
            <button className="btn" autoFocus onClick={close}>Cancel</button>
            <button className="btn danger" disabled={busy} onClick={go}>{busy ? 'Reissuing…' : 'Reissue key'}</button>
          </div>
        </div>
      ))}
    </Modal>
  );
}
