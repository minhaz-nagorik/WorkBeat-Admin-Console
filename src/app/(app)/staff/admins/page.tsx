'use client';
import { useState } from 'react';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { dateOnly } from '@/lib/time';
import { initials } from '@/lib/format';
import { useList } from '@/components/list';
import { Modal } from '@/components/confirm';
import { useDebounced } from '@/components/staff/common';

// shortcut: a 404 means the round-5 route isn't built yet; drop the check once it ships.
// GET /v1/staff/company-admins (backend round 5): Company Admins only, no other role or employee data (D41).
type Admin = { id: string; name: string; email: string; company: { id: string; name: string; slug: string }; created_at: string; must_change_password: boolean };

export default function StaffCompanyAdmins() {
  const [q, setQ] = useState('');
  const dq = useDebounced(q.trim());
  const s = useData<Admin[]>(`/v1/staff/company-admins${dq ? `?q=${encodeURIComponent(dq)}` : ''}`);
  const L = useList(s.data ?? [], () => '');
  const [resetFor, setResetFor] = useState<Admin | null>(null);

  return (
    <>
      <PageHead title="Company admins" sub="Each customer's Company Admins. Reset a password when an admin is locked out." />
      <div className="card stack">
        <div className="toolbar">
          <input type="search" className="search" placeholder="Search name, email or company" aria-label="Search name, email or company" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {s.status === 404 ? <p className="muted">This list isn’t available yet: the backend route is coming (round 5).</p> : <Loaded s={s}>{(d) => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Name</th><th>Company</th><th>Password</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={4} className="muted">{d.length || !dq ? 'No Company Admins yet.' : 'Nobody matches your search.'}</td></tr>
                    : L.rows.map((a) => (
                      <tr key={a.id}>
                        <td><div className="who"><span className="av" aria-hidden="true">{initials(a.name)}</span><div>{a.name}<div className="small muted">{a.email}</div></div></div></td>
                        <td>{a.company.name}<div className="small muted mono">{a.company.slug}.workbeat.io</div></td>
                        <td>{a.must_change_password ? <span className="pill p-warn">Temporary, not changed yet</span> : <span className="small muted">Since {dateOnly(a.created_at, 'UTC')}</span>}</td>
                        <td><button className="btn sm" onClick={() => setResetFor(a)}>Reset password</button></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>}
      </div>
      <ResetDialog a={resetFor} onClose={() => { setResetFor(null); s.reload(); }} />
    </>
  );
}

/** Confirm, then show the temporary password once. It lives only in this dialog's state (A6). */
function ResetDialog({ a, onClose }: { a: Admin | null; onClose: () => void }) {
  const [pw, setPw] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const close = () => { setPw(null); setErr(null); setCopied(false); onClose(); };

  async function go() {
    if (!a) return;
    setBusy(true); setErr(null);
    const r = await call<{ temporary_password: string }>('POST', `/v1/staff/users/${a.id}/temporary-password`);
    setBusy(false);
    if (r.ok) return setPw(r.data.temporary_password);
    setErr(r.status === 404 && !r.err.code ? 'Resetting passwords isn’t available yet.' : message(r.status, r.err.code));
  }

  return (
    <Modal title={a ? `Reset ${a.name}'s password` : 'Reset password'} open={!!a} onClose={close}>
      {a && (pw ? (
        <div className="stack">
          <p>This temporary password was also emailed to <b>{a.email}</b>. It is shown only this once.</p>
          <div className="keybox row between"><span className="mono">{pw}</span>
            <button className="btn sm" onClick={async () => { await navigator.clipboard.writeText(pw); setCopied(true); }}>{copied ? 'Copied' : 'Copy'}</button>
          </div>
          <p className="small muted">It works for 72 hours. At sign-in they must choose their own password.</p>
          <div className="mf"><button className="btn pri" onClick={close}>Done</button></div>
        </div>
      ) : (
        <div className="stack">
          <p>{a.name} ({a.email}, {a.company.name}) is signed out everywhere and their current password stops working.</p>
          <p>A temporary password is shown here and emailed to them. They must change it at their next sign-in.</p>
          {err && <div className="err" role="alert">{err}</div>}
          <div className="mf">
            <button className="btn" onClick={close} autoFocus>Cancel</button>
            <button className="btn danger" disabled={busy} onClick={go}>{busy ? 'Resetting…' : 'Reset password'}</button>
          </div>
        </div>
      ))}
    </Modal>
  );
}
