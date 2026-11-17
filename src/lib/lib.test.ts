// Run: pnpm test (node --test, native TS type stripping).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { when, dayKey, startOfToday } from './time.ts';
import { label } from './labels.ts';
import { allowed, landing } from './nav.ts';

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

test('navigation follows the role', () => {
  assert.ok(allowed('manager', '/employees'));
  assert.ok(!allowed('manager', '/devices'));
  assert.ok(!allowed('it_admin', '/employees'));
  assert.ok(!allowed('manager', '/team') && !allowed('it_admin', '/team') && allowed('company_admin', '/team'));
  assert.ok(!allowed('super_admin', '/overview'));
  assert.ok(allowed('super_admin', '/staff/companies'));
  assert.ok(allowed('super_admin', '/staff/admins') && !allowed('company_admin', '/staff/admins'));
  assert.ok(allowed('company_admin', '/employees/123'));
  assert.equal(landing('super_admin'), '/staff/companies');
  assert.equal(landing('it_admin'), '/overview');
});
