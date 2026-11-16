import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toCsv } from './csv.ts';

test('CSV cells cannot start a spreadsheet formula', () => {
  assert.equal(toCsv([['=SUM(A1)', 'a,b', 3]]), `'=SUM(A1),"a,b",3\r\n`);
});
