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

test('import CSV: semicolon file (Excel) splits into columns and drops its header', () => {
  const rows = readCsv('name;email;departemnt;manager\r\nSara Ali;sara@example.com;Sales;\r\n"Silva, Ana";ana@example.com;;\r\n');
  assert.deepEqual(rows, [['Sara Ali', 'sara@example.com', 'Sales', ''], ['Silva, Ana', 'ana@example.com', '', '']]);
  assert.deepEqual(readCsv(writeCsv(rows)), rows);
});

test('import CSV: tab-separated file', () => {
  assert.deepEqual(readCsv('Name\tEmail\nSara Ali\tsara@example.com\n'), [['Sara Ali', 'sara@example.com']]);
});

test('import CSV: a comma file with semicolons in a value stays comma-separated', () => {
  assert.deepEqual(readCsv('name,email,department\nSara Ali,sara@example.com,"R;D; QA"\n'), [['Sara Ali', 'sara@example.com', 'R;D; QA']]);
});
