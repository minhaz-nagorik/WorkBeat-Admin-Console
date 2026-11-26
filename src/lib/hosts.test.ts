// Run: pnpm test (node --test, native TS type stripping).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bareHost, isOwnHost } from './hosts.ts';

test('own hosts pass without a lookup; custom domains do not', () => {
  for (const h of ['localhost', '127.0.0.1', 'tryworkbeat.com', 'acme.tryworkbeat.com', 'wb-git-main.vercel.app', '']) assert.equal(isOwnHost(h, ''), true, h);
  for (const h of ['acme.localhost', 'monitor.acme.com', 'tryworkbeat.com.evil.com', 'eviltryworkbeat.com']) assert.equal(isOwnHost(h, ''), false, h);
  assert.equal(isOwnHost('console.example.net', 'x.test, console.example.net'), true);
});

test('the port is not part of the host', () => {
  assert.equal(bareHost('Acme.Localhost:3001'), 'acme.localhost');
  assert.equal(bareHost(null), '');
});
