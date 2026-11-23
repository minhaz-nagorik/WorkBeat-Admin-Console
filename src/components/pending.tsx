'use client';
import Link from 'next/link';
import { useEffect } from 'react';
import { call, type CallResult } from '@/lib/client';
import { useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { when } from '@/lib/time';
import { ConfirmButton } from './confirm';
import type { Change } from '@/lib/types';

// Maker-checker: a write answers 202 { change } when it must wait for a Company Admin (another one, for an admin).
export const SENT = 'Sent for approval. It shows as waiting for approval until a Company Admin decides.';

/** True when the write was stored as a change waiting for approval instead of applied. */
export function isPending<T>(r: CallResult<T>) {
  const sent = r.ok && r.status === 202;
  if (sent) window.dispatchEvent(new Event(CHANGED)); // the Waiting for approval lists refresh at once
  return sent;
}
const CHANGED = 'wb:changes';

/**
 * "Waiting for approval" card for one kind of record: members see their own requests, which they
 * can cancel; Company Admins see everyone's, with a link to Approvals.
 */
export function PendingList({ resource, onChange }: { resource: string | string[]; onChange?: () => void }) {
  const me = useMe();
  const seen = me.role !== 'super_admin';
  const kinds = Array.isArray(resource) ? resource : [resource];
  const s = useData<Change[]>(seen ? '/v1/changes?status=pending' : null, { poll: true }); // members get their own only
  const mine = (s.data ?? []).filter((c) => kinds.includes(c.resource)); // the API filters one resource at a time
  const hint = me.role === 'member' && <p className="small muted">Changes you make here wait for a Company Admin’s approval.</p>;
  const { reload } = s;
  useEffect(() => {
    const on = () => { reload(); };
    window.addEventListener(CHANGED, on);
    return () => window.removeEventListener(CHANGED, on);
  }, [reload]);
  if (!mine.length) return hint || null;

  async function cancel(c: Change) {
    await call('DELETE', `/v1/changes/${c.id}`); // a 409 means it was decided meanwhile: the reload shows that
    await s.reload(); onChange?.();
  }

  return (
    <>{hint}
    <div className="card stack" role="region" aria-label="Waiting for approval">
      <div className="cardhead">
        <h2>Waiting for approval</h2>
        <Link className="small" href="/approvals">{me.role === 'company_admin' ? 'Review on Approvals' : 'All my requests'}</Link>
      </div>
      <div className="tablewrap">
        <table>
          <tbody>
            {mine.map((c) => (
              <tr key={c.id}>
                <td><span className="pill p-warn">Waiting for approval</span></td>
                <td>{c.summary}<div className="small muted">Asked by {c.requested_by.name}, {when(c.requested_at, me.tz)}</div></td>
                <td>{c.requested_by.id === me.id
                  ? <ConfirmButton label="Cancel request" question="Cancel this request? Nothing changes." onConfirm={() => cancel(c)} />
                  : me.role === 'company_admin' ? <Link className="btn sm" href="/approvals">Review</Link> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
    </>
  );
}
