'use client';
// One "Manage" panel per company instead of a row of buttons (A16). Each section shows the current value and opens its own dialog.
import { label } from '@/lib/labels';
import { dateOnly } from '@/lib/time';
import { ConfirmButton, Modal } from '@/components/confirm';
import { StatusPill, seats, type Company } from './common';

export type ManageKind = 'plan' | 'status' | 'details' | 'grace';

export function ManageDialog({ c, onClose, onPick, onEndTrial }: {
  c: Company | null; onClose: () => void; onPick: (kind: ManageKind, c: Company) => void; onEndTrial: (c: Company) => Promise<void>;
}) {
  const trial = c?.status === 'trial';
  const rows: [ManageKind, string, React.ReactNode][] = !c ? [] : [
    ['plan', 'Plan and seats', `${label('plan', c.plan)} · ${seats(c)} seats · ${label('tier', c.screenshot_tier)} screenshots`],
    ['status', 'Status', <>
      <StatusPill c={c} />{trial && c.trial_ends_at && <span className="small muted"> until {dateOnly(c.trial_ends_at, 'UTC')} (UTC)</span>}
    </>],
    ['details', 'Name and retention', `${c.name} · keeps data ${c.data_retention_days ?? 90} days`],
    ['grace', 'Grace period', `${c.expired_blocking_grace_days} days of website blocking after the licence expires`],
  ];
  return (
    <Modal title={c ? `Manage ${c.name}` : 'Manage'} open={!!c} onClose={onClose}>
      {c && (
        <div className="stack">
          <div className="setlist">
            {rows.map(([kind, title, value]) => (
              <div key={kind} className="setrow">
                <div><b>{title}</b><div className="small">{value}</div></div>
                <div className="setctl row">
                  {kind === 'status' && trial && (
                    <ConfirmButton label="End trial" positive action="End trial now"
                      question={`End the trial of ${c.name} now? It becomes Active.`} onConfirm={() => onEndTrial(c)} />
                  )}
                  <button type="button" className="btn sm" aria-label={`Change ${title.toLowerCase()}`} onClick={() => onPick(kind, c)}>Change</button>
                </div>
              </div>
            ))}
          </div>
          <div className="mf"><button type="button" className="btn" onClick={onClose}>Close</button></div>
        </div>
      )}
    </Modal>
  );
}
