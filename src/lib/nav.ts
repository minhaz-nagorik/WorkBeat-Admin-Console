import type { Role } from './types.ts';

// Permission matrix (D41, A3). The guard only routes; the API's 403 is the real control (rule 2).
type Item = { href: string; label: string; icon: string; roles: Role[] };
const CO: Role[] = ['company_admin', 'manager', 'it_admin'];
const A: Role = 'company_admin', M: Role = 'manager', I: Role = 'it_admin', S: Role = 'super_admin';

export const NAV: { group: string; items: Item[] }[] = [
  { group: 'Company', items: [
    { href: '/overview', label: 'Overview', icon: 'overview', roles: CO },
    { href: '/employees', label: 'Employees', icon: 'employees', roles: [A, M] },
    { href: '/devices', label: 'Devices', icon: 'devices', roles: [A, I] },
    { href: '/alerts', label: 'Alerts', icon: 'alerts', roles: CO },
    { href: '/block-list', label: 'Block list', icon: 'blocklist', roles: CO },
    { href: '/productivity-rules', label: 'Productivity rules', icon: 'productivity', roles: [A, M] },
  ] },
  { group: 'Setup', items: [
    { href: '/deployment', label: 'Deployment', icon: 'deployment', roles: [A, I] },
    { href: '/team', label: 'Team & roles', icon: 'team', roles: [A] },
    { href: '/company-settings', label: 'Company settings', icon: 'company', roles: [A] },
  ] },
  { group: 'WorkBeat staff', items: [
    { href: '/staff/companies', label: 'Companies', icon: 'admin', roles: [S] },
    { href: '/staff/licences', label: 'Licences', icon: 'pricing', roles: [S] },
    { href: '/staff/domains', label: 'Custom domains', icon: 'company', roles: [S] },
    { href: '/staff/releases', label: 'Agent releases', icon: 'deployment', roles: [S] },
    { href: '/staff/team', label: 'Staff team', icon: 'team', roles: [S] },
  ] },
];

const EVERY_ROLE = ['/account'];

export const navFor = (role: Role) =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => i.roles.includes(role)) })).filter((g) => g.items.length);

export function allowed(role: Role, path: string): boolean {
  if (EVERY_ROLE.some((p) => path === p || path.startsWith(p + '/'))) return true;
  const item = NAV.flatMap((g) => g.items).find((i) => path === i.href || path.startsWith(i.href + '/'));
  return !!item && item.roles.includes(role);
}

export const landing = (role: Role) => (role === 'super_admin' ? '/staff/companies' : '/overview');
