'use client';
import { useData, Loaded } from '@/lib/use-data';
import { full, when } from '@/lib/time';
import type { TabProps } from './tabs';

type Ack = { device_id: string; hostname: string; notice_version: number; acknowledged_at: string; received_at: string };

/** Notice acknowledgements, as evidence the employee was told (D25). Company admin only. */
export function NoticeTab(props: TabProps) {
  if (props.role !== 'company_admin') return null;
  return <Acks {...props} />;
}

function Acks({ employeeId, tz }: TabProps) {
  const s = useData<Ack[]>(`/v1/employees/${employeeId}/notice-acknowledgements`);
  const n = useData<{ notice_version: number }>('/v1/settings/notice');
  return (
    <div className="card stack">
      <div><h2>Monitoring notice</h2><p className="small muted">When this person acknowledged the monitoring notice on each computer.</p></div>
      <Loaded s={s}>{(acks) => {
        const sorted = [...acks].sort((a, b) => b.received_at.localeCompare(a.received_at));
        const current = n.data?.notice_version;
        return (
          <>
            {current != null && !acks.some((a) => a.notice_version === current) && (
              <div className="notice warn" role="status">They have not acknowledged the current notice (version {current}) yet.</div>
            )}
            <div className="tablewrap"><table>
              <thead><tr><th>Computer</th><th>Notice version</th><th>Acknowledged</th><th>Received by WorkBeat</th></tr></thead>
              <tbody>
                {!sorted.length ? <tr><td colSpan={4} className="muted">No acknowledgements yet.</td></tr> : sorted.map((a) => (
                  <tr key={`${a.device_id}-${a.notice_version}-${a.received_at}`}>
                    <td className="mono">{a.hostname}</td>
                    <td className="num">{a.notice_version}{a.notice_version === current && <span className="small muted"> (current)</span>}</td>
                    <td title={full(a.acknowledged_at, tz)}>{when(a.acknowledged_at, tz)}</td>
                    <td title={full(a.received_at, tz)}>{when(a.received_at, tz)}</td>
                  </tr>
                ))}
              </tbody>
            </table></div>
          </>
        );
      }}</Loaded>
    </div>
  );
}
