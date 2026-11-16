// The one label map for every API enum shown to a person (A4, rule 6). Unknown values read "Other".
const MAPS = {
  role: { company_admin: 'Company Admin', manager: 'Manager', it_admin: 'IT Admin', super_admin: 'WorkBeat staff' },
  companyStatus: { trial: 'Trial', active: 'Active', suspended: 'Suspended', expired: 'Expired' },
  alert: {
    hosts_modified: 'Website blocking changed', offline: 'Computer offline', process_restart: 'WorkBeat was closed',
    permission_revoked: 'Permission turned off', clock_tampered: 'Computer clock changed',
    config_changed: 'WorkBeat settings edited', duplicate_device_id: 'Same computer enrolled twice',
  },
} as const;

export function label(kind: keyof typeof MAPS, value: string | null | undefined): string {
  return (MAPS[kind] as Record<string, string>)[value ?? ''] ?? 'Other';
}
