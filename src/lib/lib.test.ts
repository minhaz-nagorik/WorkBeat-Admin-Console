// Run: pnpm test (node --test, native TS type stripping).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { when, dayKey, startOfToday } from './time.ts';
import { alertLabel, label } from './labels.ts';
import { allowed, can, landing } from './nav.ts';
import type { Perm } from './types.ts';

const now = new Date('2026-11-16T05:00:00Z'); // 11:00 in Dhaka

test('times are in the company zone, not the browser zone', () => {
  assert.equal(when('2026-11-16T03:00:00Z', 'Asia/Dhaka', now), '09:00 today');
  assert.equal(when('2026-11-15T10:03:00Z', 'Asia/Dhaka', now), 'Yesterday 16:03');
  assert.equal(when('2026-11-03T04:15:00Z', 'Asia/Dhaka', now), '3 November 2026, 10:15');
  assert.equal(dayKey(new Date('2026-11-15T19:00:00Z'), 'Asia/Dhaka'), '2026-11-16');
  assert.equal(startOfToday('Asia/Dhaka', now), '2026-11-15T18:00:00.000Z');
});

test('unknown enum shows Other', () => {
  assert.equal(label('alert', 'hosts_modified'), 'Website blocking changed');
  assert.equal(label('alert', 'brand_new_type'), 'Other');
});

test('a config_changed alert reads by its reason, else as settings edited', () => {
  assert.equal(alertLabel({ event_type: 'config_changed', detail: { reason: 'uninstall_attempt' } }), 'Attempted to uninstall');
  assert.equal(alertLabel({ event_type: 'config_changed', detail: { reason: 'something_new' } }), 'WorkBeat settings edited');
  assert.equal(alertLabel({ event_type: 'config_changed', detail: {} }), 'WorkBeat settings edited');
  assert.equal(alertLabel({ event_type: 'config_changed', detail: { reason: 'toString' } }), 'WorkBeat settings edited');
  assert.equal(alertLabel({ event_type: 'hosts_modified', detail: { reason: 'uninstall_attempt' } }), 'Website blocking changed');
});

test('navigation follows the role and its permissions', () => {
  const admin = { role: 'company_admin' as const }, staff = { role: 'super_admin' as const };
  const mgr = { role: 'member' as const, permissions: ['reports', 'employees.view', 'alerts.view', 'policy.view'] as Perm[] };
  const it = { role: 'member' as const, permissions: ['employees.view', 'employees.edit', 'devices.view', 'deployment'] as Perm[] };
  assert.ok(allowed(mgr, '/employees') && !allowed(mgr, '/devices') && allowed(mgr, '/approvals'));
  assert.ok(allowed(it, '/employees') && allowed(it, '/approvals') && allowed(it, '/downloads'));
  assert.ok(!allowed(it, '/deployment') && !allowed(admin, '/downloads'));
  assert.ok(!allowed(mgr, '/team') && !allowed(it, '/team') && allowed(admin, '/team'));
  assert.ok(!allowed(staff, '/overview') && allowed(staff, '/staff/companies'));
  assert.ok(allowed(staff, '/staff/admins') && !allowed(admin, '/staff/admins'));
  assert.ok(allowed(admin, '/employees/123'));
  assert.ok(can(it, 'employees.edit') && !can(mgr, 'employees.edit') && can(admin, 'employees.edit') && !can(it, 'admin'));
  assert.equal(landing(staff), '/staff/companies');
  assert.equal(landing(it), '/overview');
});
