/** CSV with formula-looking cells prefixed by ' so a spreadsheet never runs them. */
export function toCsv(rows: (string | number)[][]): string {
  const cell = (v: string | number) => {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** The separator of the first line: comma, semicolon (Excel in many locales) or tab, whichever occurs most outside quotes. */
function separator(text: string): string {
  const n: Record<string, number> = { ',': 0, ';': 0, '\t': 0 };
  let q = false;
  for (const ch of text) {
    if (ch === '"') q = !q;
    else if (!q && (ch === '\n' || ch === '\r')) break;
    else if (!q && ch in n) n[ch]++;
  }
  return n[';'] > n[','] && n[';'] >= n['\t'] ? ';' : n['\t'] > n[','] ? '\t' : ',';
}

/** Reads an import CSV: BOM, quotes, "" escapes, CRLF or LF, and a comma, semicolon or tab separator; drops a header row starting with "name". */
export function readCsv(text: string): string[][] {
  text = text.replace(/^﻿/, '');
  const sep = separator(text);
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === sep) { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const out = rows.filter((r) => r.some((v) => v.trim())).map((r) => r.map((v) => v.trim()));
  return out[0]?.[0]?.toLowerCase() === 'name' ? out.slice(1) : out;
}

/** Plain CSV for sending back to the API: quotes only, no formula guard, so values arrive unchanged. */
export const writeCsv = (rows: string[][]) =>
  rows.map((r) => r.map((s) => (/[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s)).join(',')).join('\r\n') + '\r\n';
