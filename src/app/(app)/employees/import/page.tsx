'use client';
import Link from 'next/link';
import { useState } from 'react';
import { can } from '@/lib/nav';
import { useMe } from '@/lib/me';
import { PageHead } from '@/lib/use-data';
import { message } from '@/lib/client';
import { readCsv, writeCsv } from '@/lib/csv';
import { SENT } from '@/components/pending';
import { label } from '@/lib/labels';
import { useList } from '@/components/list';

const MAX_BYTES = 2 * 1024 * 1024, MAX_ROWS = 500;
const TOO_BIG = 'This file is too large. Import at most 500 people at a time.';
const TEMPLATE = 'name,email,department,manager email\r\nSara Ali,sara@example.com,Sales,manager@example.com\r\n';
const COLS = ['Name', 'Email', 'Department', 'Manager email'];
type Check = { invalid: { line: number; reasons: string[] }[] };

async function send(path: string, rows: string[][]) {
  try {
    const res = await fetch(`/api${path}`, { method: 'POST', headers: { 'content-type': 'text/csv' }, body: writeCsv(rows) });
    if (res.status === 401) location.assign(`/sign-in?expired=1&next=${encodeURIComponent(location.pathname)}`);
    return { status: res.status, json: await res.json().catch(() => null) };
  } catch { return { status: 0, json: { code: 'NETWORK' } }; }
}

/** CSV import: choose a file, every row is checked and shown green or red, fix or remove rows, then import all or nothing. */
export default function ImportEmployees() {
  const me = useMe();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [bad, setBad] = useState<Map<number, string[]> | null>(null); // by line; null = not checked since the last edit
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const L = useList((rows ?? []).map((r, i) => ({ r, i })), () => '', [25, 50, 100]); // i = line - 1, kept across pages

  if (!can(me, 'employees.edit')) return <div className="card"><p>You don&apos;t have access to this page.</p></div>;

  async function check(next: string[][]) {
    setRows(next); setBad(null); setErr(null);
    if (!next.length) return setErr('Add at least one person.');
    if (next.length > MAX_ROWS) return setErr(TOO_BIG);
    setBusy(true);
    const r = await send('/v1/employees/import/check', next);
    setBusy(false);
    if (r.status === 200) return setBad(new Map((r.json.data as Check).invalid.map((x) => [x.line, x.reasons])));
    setErr(r.status === 413 ? TOO_BIG : message(r.status, r.json?.code ?? ''));
  }

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) { setRows(null); return setErr(TOO_BIG); }
    check(readCsv(await f.text()).map((r) => [0, 1, 2, 3].map((i) => r[i] ?? '')));
  }

  const edit = (i: number, c: number, v: string) => { setRows(rows!.map((r, j) => (j === i ? r.map((x, k) => (k === c ? v : x)) : r))); setBad(null); };
  const remove = (i: number) => { setRows(rows!.filter((_, j) => j !== i)); setBad(null); };

  async function run() {
    setBusy(true); setErr(null);
    const r = await send('/v1/employees/import', rows!);
    setBusy(false);
    if (r.status === 202) return setDone(SENT); // a member's import waits for approval
    if (r.status === 201) return setDone(`${r.json.data.created} ${r.json.data.created === 1 ? 'employee' : 'employees'} added. Their computers can now be set up with WorkBeat Setup.`);
    if (r.status === 422 && Array.isArray(r.json?.invalid)) return setBad(new Map((r.json as Check).invalid.map((x) => [x.line, x.reasons])));
    if (r.status === 409) return setErr('Someone added one of these emails just now. Check again.');
    setErr(r.status === 413 ? TOO_BIG : message(r.status, r.json?.code ?? ''));
  }

  function template() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }));
    a.download = 'employees-template.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href));
  }

  const nBad = bad?.size ?? 0;
  return (
    <>
      <PageHead title="Import employees" sub="Download the template, fill in one person per line, then choose the file. Name and email are required." />
      {done ? (
        <div className="card stack">
          <div className="notice ok" role="status">{done}</div>
          <div className="row"><Link className="btn pri" href="/employees">Back to Employees</Link></div>
        </div>
      ) : (
        <div className="card stack">
          <div className="row">
            <button type="button" className="btn sm" onClick={template}>Download template</button>
            <label className="btn sm" htmlFor="imp-file">{rows ? 'Choose another file…' : 'Choose file…'}</label>
            <input type="file" id="imp-file" accept=".csv,text/csv" onChange={pick} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
          </div>
          {rows && rows.length > 0 && (
            <>
              <p className="small" role="status">
                {busy ? 'Checking…' : !bad ? 'You changed the list. Check it again before importing.'
                  : nBad ? `${nBad} of ${rows.length} ${rows.length === 1 ? 'line has' : 'lines have'} a problem. Fix or remove the red lines, or cancel and fix the file.`
                  : `All ${rows.length} ${rows.length === 1 ? 'person is' : 'people are'} ready to import.`}
              </p>
              <div className="tablewrap"><table>
                <thead><tr><th>Line</th>{COLS.map((c) => <th key={c}>{c}</th>)}<th>Problem</th><th /></tr></thead>
                <tbody>{L.rows.map(({ r, i }) => {
                  const why = bad?.get(i + 1);
                  const bg = !bad ? undefined : why ? 'var(--bad-soft)' : 'var(--ok-soft)';
                  return (
                    <tr key={i} style={{ background: bg }}>
                      <td className="num">{i + 1}</td>
                      {r.map((v, c) => <td key={c}><input aria-label={`${COLS[c]}, line ${i + 1}`} value={v} onChange={(e) => edit(i, c, e.target.value)} /></td>)}
                      <td className="small">{!bad ? '' : why ? why.map((x) => label('importReason', x)).join('. ') : 'OK'}</td>
                      <td><button type="button" className="btn sm" onClick={() => remove(i)} aria-label={`Remove line ${i + 1}`}>Remove</button></td>
                    </tr>
                  );
                })}</tbody>
              </table></div>
              {L.pager}
            </>
          )}
          {err && <div className="err" role="alert">{err}</div>}
          <div className="mf">
            <Link className="btn" href="/employees">Cancel import</Link>
            {rows && !bad && <button type="button" className="btn" onClick={() => check(rows)} disabled={busy}>Check again</button>}
            <button type="button" className="btn pri" onClick={run} disabled={!rows?.length || !bad || nBad > 0 || busy}>
              {busy ? 'Working…' : `Import ${rows?.length ?? 0} ${rows?.length === 1 ? 'employee' : 'employees'}`}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
