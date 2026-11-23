import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCsv, toCsv, writeCsv } from './csv.ts';

test('CSV cells cannot start a spreadsheet formula', () => {
  assert.equal(toCsv([['=SUM(A1)', 'a,b', 3]]), `'=SUM(A1),"a,b",3\r\n`);
});

test('import CSV: BOM, header, CRLF and quotes read back unchanged', () => {
  const rows = readCsv('﻿name,email\r\n"Silva, Ana",a@x.co\r\n\r\n"Say ""hi""",-b@x.co\n');
  assert.deepEqual(rows, [['Silva, Ana', 'a@x.co'], ['Say "hi"', '-b@x.co']]);
  assert.deepEqual(readCsv(writeCsv(rows)), rows);
});
