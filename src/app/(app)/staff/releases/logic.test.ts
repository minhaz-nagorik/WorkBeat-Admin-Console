// Run: node --test 'src/app/(app)/staff/releases/logic.test.ts'
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { check, cmp, minimum, state, type Release } from './logic.ts';

const r = (o: Partial<Release>): Release => ({
  id: o.version ?? 'x', product: 'agent', platform: 'windows', arch: 'x64', version: '1.0.0', min_supported: '1.0.0',
  sha256: '', signature: null, size_bytes: 1, release_notes: null, released_at: '', withdrawn_at: null, ...o,
});

test('versions compare numerically', () => {
  assert.ok(cmp('1.0.10', '1.0.9') > 0);
  assert.equal(cmp('2.0.0', '2.0.0'), 0);
});

test('minimum comes from the newest live agent release', () => {
  const rs = [r({ version: '1.0.4', min_supported: '1.0.3' }), r({ version: '1.0.5', min_supported: '1.0.5', withdrawn_at: 'x' }), r({ version: '1.0.2', min_supported: '1.0.0' })];
  assert.equal(minimum(rs, 'windows'), '1.0.3');
  assert.equal(minimum(rs, 'macos'), null);
  assert.equal(state(rs[0], rs), 'Current');
  assert.equal(state(rs[1], rs), 'Withdrawn');
  assert.equal(state(rs[2], rs), 'Supported');
});

test('publish form refuses a minimum above the version and macOS without universal or signature', () => {
  const base = { platform: 'windows', arch: 'x64', version: '1.0.5', min_supported: '1.0.6', signature: '', file: {} };
  assert.ok(check(base).min_supported);
  assert.deepEqual(check({ ...base, min_supported: '1.0.5' }), {});
  const mac = check({ ...base, min_supported: '1.0.5', platform: 'macos', arch: 'x64' });
  assert.ok(mac.arch && mac.signature);
});
