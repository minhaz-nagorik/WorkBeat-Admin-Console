// The one label map for every API enum shown to a person (A4, rule 6). Unknown values read "Other".
// Add a map inside MAPS; keep each area's maps under its own comment.
const MAPS = {
  role: { company_admin: 'Company Admin', member: 'Team member', super_admin: 'WorkBeat staff' },
  perm: {
    reports: 'Reports, activity and screenshots', 'employees.view': 'See employees', 'employees.edit': 'Change employees',
    'devices.view': 'See computers', 'devices.edit': 'Release or deactivate computers', 'alerts.view': 'See alerts', 'alerts.edit': 'Resolve alerts',
    'policy.view': 'See block list and productivity rules', 'policy.edit': 'Change block list and productivity rules', deployment: 'Install WorkBeat (downloads)',
  },
  companyStatus: { trial: 'Trial', active: 'Active', suspended: 'Suspended', expired: 'Expired' },
  alert: {
    hosts_modified: 'Website blocking changed', offline: 'Computer offline', process_restart: 'WorkBeat was closed',
    permission_revoked: 'Permission turned off', clock_tampered: 'Computer clock changed',
    config_changed: 'WorkBeat settings edited', duplicate_device_id: 'Possible duplicate computer',
  },
  // devices
  setupStep: { download_downloader: 'Download WorkBeat Setup', copy_license_key: 'Copy the licence key', install_first_device: 'Install the first device', first_device_seen: 'First device seen' },
  grant: { granted: 'Allowed', pending: 'Waiting for the employee', denied: 'Not allowed', unreadable: "Can't read" },
  permission: { granted: 'Allowed', pending: 'Not yet allowed', denied: 'Not yet allowed', unreadable: 'Not yet allowed' },
  helper: { running: 'Running', restarting: 'Restarting', not_running: 'Not running', no_session: 'Nobody signed in' },
  blocking: { applied: 'Working', degraded: 'Partly working', off: 'Off' },
  dropReason: { store_full: 'Storage full', too_old: 'Too old to send', app_sessions: 'App use', url_visits: 'Website visits', activity: 'Activity', idle: 'Idle time', screenshots: 'Screenshots' },
  macPermission: { screen_recording: 'Screen Recording', accessibility: 'Accessibility', automation: 'Automation' },
  deviceStatus: { online: 'Online', offline: 'Offline', deactivated: 'Deactivated', released: 'Released' },
  badge: { outdated: 'Outdated', permission_pending: 'Permission pending', browser_access_pending: 'Browser access pending', paused: 'Paused', open_alert: 'Open alert' },
  os: { macos: 'macOS', windows: 'Windows' },
  // employees
  presence: { active: 'Active', idle: 'Idle', offline: 'Offline', paused: 'Monitoring paused', no_device: 'No device' },
  pauseReason: { annual_leave: 'Annual leave', sick_leave: 'Sick leave', personal: 'Personal time', offsite_training: 'Off-site or training', other: 'Other' },
  pauseState: { scheduled: 'Scheduled', active: 'Active now', ended: 'Ended', cancelled: 'Cancelled' },
  interval: { 0: 'Off', 600: 'Every 10 minutes', 1800: 'Every 30 minutes', 3600: 'Every 60 minutes' },
  // reports
  period: { day: 'Day', week: 'Week', month: 'Month' },
  category: { productive: 'Productive', neutral: 'Neutral', unproductive: 'Unproductive' },
  // policies
  delivery: { instant: 'As they happen', hourly: 'Hourly digest', daily: 'Daily digest at 09:00' },
  ruleType: { domain: 'Website', url: 'Web address', regex: 'Pattern' },
  matchType: { app: 'App', domain: 'Website' },
  // company
  tier: { off: 'Off', light: 'Light', standard: 'Standard', intensive: 'Intensive' },
  plan: { starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' },
  domainStatus: { pending: 'Waiting for DNS records', active: 'Active', failed: 'Not verified' },
  // staff
  suspendedReason: { staff: 'By WorkBeat', payment_failed: 'Payment failed' },
  arch: { universal: 'Universal', x64: 'x64', arm64: 'ARM64' },
  product: { agent: 'WorkBeat agent', downloader: 'WorkBeat Setup' },
} as const;

export type LabelKind = keyof typeof MAPS;

export function label(kind: LabelKind, value: string | null | undefined): string {
  return (MAPS[kind] as Record<string, string>)[value ?? ''] ?? 'Other';
}

/** [value, label] pairs of a map, for selects and filters. */
export const options = (kind: LabelKind) => Object.entries(MAPS[kind]) as [string, string][];
