import type { Me, Perm } from './types.ts';

// What a page needs: a permission, Company Admin ('admin'), any company user ('any'), or WorkBeat staff.
export type Need = Perm | 'admin' | 'any' | 'staff';
type Who = Pick<Me, 'role' | 'permissions'>;
/** The guard only routes and hides; the API's 403 is the real control (rule 2). */
export const can = (me: Who, need: Need) =>
  need === 'staff' ? me.role === 'super_admin'
    : me.role !== 'super_admin' && (need === 'any' || me.role === 'company_admin' || (need !== 'admin' && !!me.permissions?.includes(need)));
const canAny = (me: Who, needs: Need[]) => needs.some((n) => can(me, n));

type Item = { href: string; label: string; icon: string; needs: Need[] };
const A: Need = 'admin', S: Need = 'staff';

export const NAV: { group: string; items: Item[] }[] = [
  { group: 'Company', items: [
    { href: '/overview', label: 'Overview', icon: 'overview', needs: ['any'] },
    { href: '/employees', label: 'Employees', icon: 'employees', needs: ['employees.view'] },
    { href: '/devices', label: 'Devices', icon: 'devices', needs: ['devices.view'] },
    { href: '/alerts', label: 'Alerts', icon: 'alerts', needs: ['alerts.view'] },
    { href: '/block-list', label: 'Block list', icon: 'blocklist', needs: ['policy.view'] },
    { href: '/productivity-rules', label: 'Productivity rules', icon: 'productivity', needs: ['policy.view'] },
  ] },
  { group: 'Setup', items: [
    { href: '/deployment', label: 'Deployment', icon: 'deployment', needs: [A] },
    { href: '/downloads', label: 'Downloads', icon: 'deployment', needs: ['deployment'] },
    { href: '/approvals', label: 'Approvals', icon: 'admin', needs: ['any'] },
    { href: '/team', label: 'Team & roles', icon: 'team', needs: [A] },
    { href: '/company-settings', label: 'Company settings', icon: 'company', needs: [A] },
  ] },
  { group: 'WorkBeat staff', items: [
    { href: '/staff/companies', label: 'Companies', icon: 'admin', needs: [S] },
    { href: '/staff/licences', label: 'Licences', icon: 'pricing', needs: [S] },
    { href: '/staff/domains', label: 'Custom domains', icon: 'company', needs: [S] },
    { href: '/staff/releases', label: 'Agent releases', icon: 'deployment', needs: [S] },
    { href: '/staff/admins', label: 'Company admins', icon: 'team', needs: [S] },
    { href: '/staff/team', label: 'Staff team', icon: 'admin', needs: [S] },
  ] },
];

const EVERY_ROLE = ['/account'];

// Downloads is for those who install but cannot see the Deployment page (Company Admins see Deployment).
const shown = (me: Who, i: Item) => canAny(me, i.needs) && !(i.href === '/downloads' && me.role === 'company_admin');

export const navFor = (me: Who) =>
  NAV.map((g) => ({ ...g, items: g.items.filter((i) => shown(me, i)) })).filter((g) => g.items.length);

export function allowed(me: Who, path: string): boolean {
  if (EVERY_ROLE.some((p) => path === p || path.startsWith(p + '/'))) return true;
  const item = NAV.flatMap((g) => g.items).find((i) => path === i.href || path.startsWith(i.href + '/'));
  return !!item && shown(me, item);
}

export const landing = (me: Who) => (me.role === 'super_admin' ? '/staff/companies' : '/overview');
