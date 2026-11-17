'use client';
import Link from 'next/link';
import { call, type CallResult } from '@/lib/client';
import { useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { when } from '@/lib/time';
import { ConfirmButton } from './confirm';
import type { Change } from '@/lib/types';

// IT Admin writes answer 202 { change } and wait for a Company Admin (backend round 6).
export const SENT = 'Sent to your Company Admin for approval. It shows as waiting for approval until they decide.';

/** True when the write was stored as a change waiting for approval instead of applied. */
export const isPending = <T,>(r: CallResult<T>) => r.ok && r.status === 202;

/**
 * "Waiting for approval" card for one kind of record, shown to IT Admins (their own requests,
 * which they can cancel) and Company Admins (everyone's, with a link to Approvals).
 */
export function PendingList({ resource, onChange }: { resource: string | string[]; onChange?: () => void }) {
  const me = useMe();
  const seen = me.role === 'company_admin' || me.role === 'it_admin';
  const kinds = Array.isArray(resource) ? resource.join(',') : resource;
  const s = useData<Change[]>(seen ? `/v1/changes?status=pending&resource=${kinds}` : null, { poll: true });
  const hint = me.role === 'it_admin' && <p className="small muted">Changes you make here wait for your Company Admin’s approval.</p>;
  if (!s.data?.length) return hint || null;

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
            {s.data.map((c) => (
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
