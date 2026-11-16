'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label, options } from '@/lib/labels';
import { useMe } from '@/lib/me';
import { useData, Loaded, PageHead } from '@/lib/use-data';
import { useList } from '@/components/list';
import { ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';

type Cat = 'productive' | 'neutral' | 'unproductive';
type Rule = { id: string; match_type: 'app' | 'domain'; pattern: string; category: Cat };

const CATS = options('category') as [Cat, string][];
const COLOR: Record<Cat, string> = { productive: 'var(--prod)', neutral: 'var(--neu)', unproductive: 'var(--unprod)' };
const RECALC = 'Reports were recalculated, past ones included.';
const CONFLICT = 'A rule for this app or website already exists.';

export default function ProductivityRules() {
  const me = useMe();
  const canEdit = me.role === 'company_admin';
  const rules = useData<Rule[]>('/v1/productivity-rules');
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const all = rules.data ?? [];
  const L = useList(all.filter((r) => cat === 'all' || r.category === cat), (r) => `${r.pattern} ${label('matchType', r.match_type)} ${label('category', r.category)}`);
  const n = (c: Cat | 'all') => all.filter((r) => c === 'all' || r.category === c).length;

  async function change(r: Rule, category: Cat) {
    const res = await call<Rule>('PATCH', `/v1/productivity-rules/${r.id}`, { category });
    if (res.ok) { rules.set((d) => d && d.map((x) => (x.id === r.id ? res.data : x))); return setNote({ ok: true, text: `${r.pattern} now counts as ${label('category', category).toLowerCase()}. ${RECALC}` }); }
    if (res.status === 404) rules.set((d) => d && d.filter((x) => x.id !== r.id));
    setNote({ ok: false, text: res.status === 404 ? 'This rule was already deleted.' : message(res.status, res.err.code) });
  }

  async function remove(r: Rule) {
    const res = await call('DELETE', `/v1/productivity-rules/${r.id}`);
    if (res.ok || res.status === 404) {
      rules.set((d) => d && d.filter((x) => x.id !== r.id));
      return setNote({ ok: true, text: res.ok ? `Rule for ${r.pattern} deleted. It now counts as neutral. ${RECALC}` : 'This rule was already deleted.' });
    }
    setNote({ ok: false, text: message(res.status, res.err.code) });
  }

  return (
    <>
      <PageHead title="Productivity rules"
        sub={canEdit
          ? 'Mark apps and sites as productive or unproductive. Anything without a rule counts as neutral. Changing a rule updates every report, past ones included.'
          : 'Read-only. Your Company Admin sets these rules. Anything without a rule counts as neutral.'}
        right={canEdit && <button className="btn pri" onClick={() => setAdding(true)}>Add rule</button>} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}

      <Loaded s={rules}>{(data) => (
        <div className="card stack">
          <div className="toolbar">
            {L.search('Search apps or websites')}
            <div className="seg" role="group" aria-label="Category">
              {([['all', 'All'], ...CATS] as [Cat | 'all', string][]).map(([k, l]) => (
                <button key={k} className={cat === k ? 'on' : ''} aria-pressed={cat === k} onClick={() => setCat(k)}>{l} <span className="muted">{n(k)}</span></button>
              ))}
            </div>
          </div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>App or website</th><th>Type</th><th>Category</th>{canEdit && <th><span className="sr-only">Actions</span></th>}</tr></thead>
              <tbody>
                {!L.rows.length ? <tr><td colSpan={4} className="muted">{data.length ? 'No rules match.' : 'No rules yet. Everything counts as neutral.'}</td></tr>
                  : L.rows.map((r) => (
                    <tr key={r.id}>
                      <td className={r.match_type === 'domain' ? 'mono' : undefined}>{r.pattern}</td>
                      <td><span className="tag">{label('matchType', r.match_type)}</span></td>
                      <td>{canEdit ? (
                        <select aria-label={`Category for ${r.pattern}`} style={{ maxWidth: 180 }} value={r.category} onChange={(e) => change(r, e.target.value as Cat)}>
                          {CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                        </select>
                      ) : <span className="row" style={{ gap: 6 }}><span className="dot" style={{ background: COLOR[r.category] }} aria-hidden="true" />{label('category', r.category)}</span>}</td>
                      {canEdit && <td><ConfirmButton label="Delete" question={`Delete the rule for ${r.pattern}? It will count as neutral in every report, past ones included.`} onConfirm={() => remove(r)} /></td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {L.pager}
        </div>
      )}</Loaded>

      <AddDialog open={adding} onClose={() => setAdding(false)}
        onSaved={(r) => { setAdding(false); rules.set((d) => d && [r, ...d]); setNote({ ok: true, text: `Rule added for ${r.pattern}. ${RECALC}` }); }} />
    </>
  );
}

function AddDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: (r: Rule) => void }) {
  const [match, setMatch] = useState<Rule['match_type']>('app');
  const [category, setCategory] = useState<Cat>('productive');
  const [pattern, setPattern] = useState('');
  const [err, setErr] = useState<{ pattern?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setMatch('app'); setCategory('productive'); setPattern(''); setErr({}); } }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call<Rule>('POST', '/v1/productivity-rules', { match_type: match, pattern: pattern.trim(), category });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    if (r.status === 409) return setErr({ pattern: CONFLICT });
    if (r.status === 422 || r.status === 400) return setErr({ pattern: match === 'domain' ? 'Type just the website, like notion.so.' : 'Type the app’s name, like Microsoft Word.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Add productivity rule" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <p className="small">Reports count time in this app or site as productive, neutral or unproductive. The change applies to every report, past ones included.</p>
        <div className="grid g2">
          <div className="field">
            <label htmlFor="pr-m">Is it an app or a website?</label>
            <select id="pr-m" value={match} onChange={(e) => setMatch(e.target.value as Rule['match_type'])}>
              {options('matchType').map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="pr-c">Count it as</label>
            <select id="pr-c" value={category} onChange={(e) => setCategory(e.target.value as Cat)}>
              {CATS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
        </div>
        <Field id="pr-p" type="text" label={match === 'app' ? 'App name' : 'Website address'} required maxLength={255} autoFocus
          placeholder={match === 'app' ? 'Microsoft Word' : 'notion.so'} value={pattern} error={err.pattern} onChange={(e) => setPattern(e.target.value)} />
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Adding…' : 'Add rule'}</button>
        </div>
      </form>
    </Modal>
  );
}
