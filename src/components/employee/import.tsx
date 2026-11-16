'use client';
import { useEffect, useState } from 'react';
import { message } from '@/lib/client';
import { Modal } from '@/components/confirm';

const MAX_BYTES = 2 * 1024 * 1024, MAX_ROWS = 5000;
const TEMPLATE = 'name,email,department,manager email\nSara Ali,sara@example.com,Sales,manager@example.com\n';
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Same reading as the API's (quoted fields, "" escapes, CRLF or LF); header row dropped if it starts with "name".
function rowsOf(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === ',') { row.push(cell); cell = ''; }
    else if (ch === '\n' || ch === '\r') { if (ch === '\r' && text[i + 1] === '\n') i++; row.push(cell); rows.push(row); row = []; cell = ''; }
    else cell += ch;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const out = rows.filter((r) => r.some((v) => v.trim())).map((r) => r.map((v) => v.trim()));
  return out[0]?.[0]?.toLowerCase() === 'name' ? out.slice(1) : out;
}

type Result = { created: number; skipped: number; skipped_emails: string[] };

/** CSV import: choose or paste, Check previews, Import sends the raw text/csv (all or nothing). */
export function ImportDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: () => void }) {
  const [text, setText] = useState('');
  const [checked, setChecked] = useState<string[][] | null>(null);
  const [err, setErr] = useState<React.ReactNode>(null);
  const [result, setResult] = useState<Result | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setText(''); setChecked(null); setErr(null); setResult(null); } }, [open]);

  const edit = (t: string) => { setText(t); setChecked(null); setErr(null); };
  const tooBig = () => new Blob([text]).size > MAX_BYTES;

  async function pick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]; e.target.value = '';
    if (!f) return;
    if (f.size > MAX_BYTES) { edit(''); return setErr('This file is too large. Import at most 2 MB and 5,000 people at a time.'); }
    edit(await f.text());
  }

  function check() {
    if (tooBig()) return setErr('This file is too large. Import at most 2 MB and 5,000 people at a time.');
    const rows = rowsOf(text);
    if (!rows.length) return setErr('Add at least one person.');
    if (rows.length > MAX_ROWS) return setErr('This file is too large. Import at most 2 MB and 5,000 people at a time.');
    const bad = rows.flatMap((r, i) => (!r[0] || !EMAIL.test(r[1] ?? '') ? [i + 1] : []));
    if (bad.length) return setErr(lines(bad));
    setErr(null); setChecked(rows);
  }

  async function run() {
    setBusy(true); setErr(null);
    let res: Response;
    try {
      res = await fetch('/api/v1/employees/import', { method: 'POST', headers: { 'content-type': 'text/csv' }, body: text });
    } catch { setBusy(false); return setErr(message(0, 'NETWORK')); }
    const json = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok) { setResult(json?.data as Result); return onDone(); }
    if (res.status === 401) return location.assign(`/sign-in?expired=1&next=${encodeURIComponent(location.pathname)}`);
    setChecked(null);
    if (res.status === 413) return setErr('This file is too large. Import at most 2 MB and 5,000 people at a time.');
    if (res.status === 422 && Array.isArray(json?.lines)) return setErr(lines(json.lines, true));
    setErr(message(res.status, json?.code ?? ''));
  }

  function template() {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([TEMPLATE], { type: 'text/csv' }));
    a.download = 'employees-template.csv'; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href));
  }

  return (
    <Modal title="Import employees from CSV" open={open} onClose={onClose}>
      {result ? (
        <div className="stack">
          <div className="notice ok" role="status">{result.created} {result.created === 1 ? 'employee' : 'employees'} added, {result.skipped} skipped.</div>
          {result.skipped > 0 && <p className="small">Skipped because an employee already uses the email: <span className="mono">{result.skipped_emails.join(', ')}</span></p>}
          <div className="mf"><button className="btn pri" onClick={onClose}>Done</button></div>
        </div>
      ) : (
        <div className="stack">
          <p className="small">One person per line: <span className="mono">name, email, department, manager email</span>. Name and email are required. A header row is fine. Emails already in use are skipped.</p>
          <div className="row">
            <button type="button" className="btn sm" onClick={template}>Download template</button>
            <label className="btn sm" htmlFor="imp-file">Choose file…</label>
            <input type="file" id="imp-file" accept=".csv,text/csv" onChange={pick} style={{ position: 'absolute', opacity: 0, width: 1, height: 1 }} />
          </div>
          <div className="field">
            <label htmlFor="imp-text">Or paste CSV</label>
            <textarea id="imp-text" rows={6} className="mono" value={text} onChange={(e) => edit(e.target.value)}
              placeholder={'name,email,department,manager email\nSara Ali,sara@example.com,Sales,manager@example.com'} />
          </div>
          {checked && (
            <div className="stack" style={{ gap: 6 }}>
              <p className="small" role="status">{checked.length} {checked.length === 1 ? 'person' : 'people'} ready to import. Manager emails are checked on import.</p>
              <div className="tablewrap"><table>
                <thead><tr><th>Line</th><th>Name</th><th>Email</th><th>Department</th><th>Manager email</th></tr></thead>
                <tbody>{checked.slice(0, 10).map((r, i) => <tr key={i}><td className="num">{i + 1}</td><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td><td>{r[3]}</td></tr>)}</tbody>
              </table></div>
              {checked.length > 10 && <p className="small muted">and {checked.length - 10} more.</p>}
            </div>
          )}
          {err && <div className="err" role="alert">{err}</div>}
          <div className="mf">
            <button type="button" className="btn" onClick={onClose}>Cancel</button>
            <button type="button" className="btn" onClick={check} disabled={!text.trim()}>Check</button>
            <button type="button" className="btn pri" onClick={run} disabled={!checked || busy}>{busy ? 'Importing…' : 'Import'}</button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function lines(n: number[], server = false) {
  const shown = n.slice(0, 20).join(', ') + (n.length > 20 ? ` and ${n.length - 20} more` : '');
  return `${server ? 'Nothing was imported. ' : ''}Fix ${n.length === 1 ? 'line' : 'lines'} ${shown} (counting people, not the header): each needs a name and a valid email${server ? ' used once in the file, and any manager email must belong to a Manager' : ''}.`;
}
