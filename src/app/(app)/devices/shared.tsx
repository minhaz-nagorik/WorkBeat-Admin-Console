'use client';
import { label } from '@/lib/labels';

export type Device = {
  id: string; hostname: string; os: 'macos' | 'windows'; os_version: string; arch: string; agent_version: string;
  employee: { id: string; name: string };
  status: 'online' | 'offline' | 'tamper' | 'deactivated' | 'released';
  badges: ('outdated' | 'permission_pending' | 'browser_access_pending' | 'paused')[];
  last_heartbeat_at: string | null; released_at: string | null; deactivated_at: string | null;
};

const STATUS_PILL: Record<string, string> = { online: 'p-ok', offline: '', tamper: 'p-bad', deactivated: '', released: '' };
const BADGE_PILL: Record<string, string> = { outdated: 'p-warn', permission_pending: 'p-info', browser_access_pending: 'p-info', paused: 'p-acc' };

export const StatusPill = ({ s }: { s: string }) => <span className={`pill ${STATUS_PILL[s] ?? ''}`}>{label('deviceStatus', s)}</span>;

export function Badges({ d }: { d: Device }) {
  if (d.status === 'online' && !d.badges.length) return <span className="pill p-ok">Installed and working</span>;
  if (!d.badges.length) return <span className="muted small">None</span>;
  return <span className="row" style={{ gap: 4 }}>{d.badges.map((b) => <span key={b} className={`pill ${BADGE_PILL[b]}`}>{label('badge', b)}</span>)}</span>;
}

/** "12 Nov 2026" in the company zone. */
export const shortDate = (iso: string, tz: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
