'use client';
import { useState } from 'react';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { when, full } from '@/lib/time';
import { useList } from '@/components/list';
import { ConfirmButton, Modal } from '@/components/confirm';
import type { Change } from '@/lib/types';

// Maker-checker: Company Admins decide others' changes, never their own; everyone follows and cancels their own.
const STATUS: Record<Change['status'], [string, string]> = {
  pending: ['Waiting for approval', 'p-warn'], approved: ['Approved', 'p-ok'], rejected: ['Rejected', 'p-bad'],
  cancelled: ['Cancelled', ''], failed: ['Couldn’t be applied', 'p-bad'],
};

export default function Approvals() {
  const me = useMe();
  const admin = me.role === 'company_admin';
  const [view, setView] = useState<'pending' | 'decided'>('pending');
  const s = useData<Change[]>('/v1/changes', { poll: true });
  const rows = (s.data ?? []).filter((c) => (view === 'pending') === (c.status === 'pending'));
  const L = useList(rows, (c) => `${c.summary} ${c.requested_by.name} ${STATUS[c.status][0]}`);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [rejecting, setRejecting] = useState<Change | null>(null);
  const pendingCount = (s.data ?? []).filter((c) => c.status === 'pending').length;
  // Own changes wait for another Company Admin; the API lets a lone admin decide them (no one else can).

  async function approve(c: Change) {
    const r = await call<{ change: Change }>('POST', `/v1/changes/${c.id}/approve`);
    if (r.ok && r.data.change.status === 'failed') setNote({ ok: false, text: `Couldn’t apply “${c.summary}”: ${r.data.change.error?.message ?? 'it no longer applies'}.` });
    else if (r.ok) setNote({ ok: true, text: `Approved: ${c.summary}.` });
    else setNote({ ok: false, text: r.status === 409 ? 'This request was already decided or cancelled.'
      : r.status === 403 ? 'Another Company Admin must approve your own change.' : message(r.status, r.err.code) });
    s.reload();
  }
  async function cancel(c: Change) {
    const r = await call('DELETE', `/v1/changes/${c.id}`);
    setNote(r.ok ? { ok: true, text: `Cancelled: ${c.summary}.` } : { ok: false, text: r.status === 409 ? 'This request was already decided.' : message(r.status, r.err.code) });
    s.reload();
  }

  return (
    <>
      <PageHead title={admin ? 'Approvals' : 'My requests'}
        sub={admin ? 'Changes your team asked for. Nothing changes until a Company Admin approves it; your own changes wait for another Company Admin.' : 'Your changes wait here until a Company Admin approves them.'} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <div className="card stack">
        <div className="toolbar">
          {L.search('Search requests')}
          <div className="seg" role="group" aria-label="Show">
            <button className={view === 'pending' ? 'on' : ''} aria-pressed={view === 'pending'} onClick={() => setView('pending')}>Waiting <span className="muted">{pendingCount}</span></button>
            <button className={view === 'decided' ? 'on' : ''} aria-pressed={view === 'decided'} onClick={() => setView('decided')}>Decided</button>
          </div>
        </div>
        <Loaded s={s}>{() => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Change</th><th>Asked by</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={4} className="muted">{view === 'pending' ? 'Nothing is waiting for approval.' : 'No decided requests yet.'}</td></tr>
                    : L.rows.map((c) => (
                      <tr key={c.id}>
                        <td>{c.summary}
                          {c.status === 'rejected' && c.reason && <div className="small muted">Reason: {c.reason}</div>}
                          {c.status === 'failed' && c.error && <div className="small muted">{c.error.message}</div>}</td>
                        <td>{c.requested_by.name}<div className="small muted" title={full(c.requested_at, me.tz)}>{when(c.requested_at, me.tz)}</div></td>
                        <td><span className={`pill ${STATUS[c.status][1]}`}>{STATUS[c.status][0]}</span>
                          {c.decided_by && <div className="small muted">by {c.decided_by.name}{c.decided_at ? `, ${when(c.decided_at, me.tz)}` : ''}</div>}</td>
                        <td>{c.status !== 'pending' ? null : c.requested_by.id === me.id ? (
                          <div className="row">
                            {admin && <span className="small muted">Waiting for another Company Admin</span>}
                            <ConfirmButton label="Cancel request" question="Cancel this request? Nothing changes." onConfirm={() => cancel(c)} />
                          </div>
                        ) : admin ? (
                          <div className="row">
                            <button className="btn sm" onClick={() => setRejecting(c)}>Reject</button>
                            <ConfirmButton positive label="Approve" action="Approve" question={`Approve “${c.summary}”? It takes effect now.`} onConfirm={() => approve(c)} />
                          </div>
                        ) : null}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>
      </div>
      <RejectDialog c={rejecting} onClose={() => setRejecting(null)}
        onDone={(c, text) => { setRejecting(null); setNote(text ? { ok: false, text } : { ok: true, text: `Rejected: ${c.summary}.` }); s.reload(); }} />
    </>
  );
}

function RejectDialog({ c, onClose, onDone }: { c: Change | null; onClose: () => void; onDone: (c: Change, error?: string) => void }) {
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!c) return;
    setBusy(true);
    const r = await call('POST', `/v1/changes/${c.id}/reject`, { reason: reason.trim() || undefined });
    setBusy(false); setReason('');
    onDone(c, r.ok ? undefined : r.status === 409 ? 'This request was already decided or cancelled.' : message(r.status, r.err.code));
  }
  return (
    <Modal title="Reject request" open={!!c} onClose={onClose}>
      {c && (
        <form method="post" className="stack" onSubmit={submit}>
          <p>{c.summary}, asked by {c.requested_by.name}. Nothing changes.</p>
          <div className="field">
            <label htmlFor="rej-reason">Reason (optional, {c.requested_by.name} sees it)</label>
            <textarea id="rej-reason" rows={3} maxLength={500} value={reason} onChange={(e) => setReason(e.target.value)} />
          </div>
          <div className="mf">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button className="btn danger" disabled={busy}>{busy ? 'Rejecting…' : 'Reject'}</button>
          </div>
        </form>
      )}
    </Modal>
  );
}
