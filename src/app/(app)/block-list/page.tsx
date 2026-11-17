'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { useMe } from '@/lib/me';
import { when, full } from '@/lib/time';
import { useData, Loaded, PageHead } from '@/lib/use-data';
import { isPending, PendingList, SENT } from '@/components/pending';
import { useList } from '@/components/list';
import { Confirm, ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';

type Rule = { id: string; type: 'domain' | 'url'; pattern: string; reason: string | null; created_at: string; created_by_name?: string | null };
type Site = { id: string; pattern: string; is_default: boolean; created_at: string };
type Note = { ok: boolean; text: string } | null;

const BLOCKS = { domain: 'Whole site and its subdomains, in every browser and app', url: 'Only this part of the site, in most browsers' };
const GAP = 'In Firefox on Mac and in Brave, Opera and Vivaldi on Windows only whole-website rules work.';
const SYNC = 'Computers update within 30 minutes.';
// A typed regular expression goes to the API as `regex`, which turns it into url rules.
const looksRegex = (s: string) => /^\^|[\\()|[\]$]/.test(s);

export default function BlockList() {
  const me = useMe();
  const canEdit = me.role === 'company_admin' || me.role === 'it_admin';
  const rules = useData<Rule[]>('/v1/block-rules');
  const [note, setNote] = useState<Note>(null);
  const [editing, setEditing] = useState<Rule | 'new' | null>(null);
  const [created, setCreated] = useState<Rule[] | null>(null);
  const L = useList(rules.data ?? [], (r) => [r.pattern, r.reason, r.created_by_name, BLOCKS[r.type]].join(' '));

  async function remove(r: Rule) {
    const res = await call('DELETE', `/v1/block-rules/${r.id}`);
    if (isPending(res)) return setNote({ ok: true, text: SENT });
    if (res.ok || res.status === 404) {
      rules.set((d) => d && d.filter((x) => x.id !== r.id));
      return setNote({ ok: true, text: res.ok ? `${r.pattern} is no longer blocked. ${SYNC}` : 'This rule was already deleted.' });
    }
    setNote({ ok: false, text: message(res.status, res.err.code) });
  }

  function saved(r: Rule | Rule[], isNew: boolean) {
    setEditing(null);
    const list = Array.isArray(r) ? r : [r];
    rules.set((d) => d && (isNew ? [...list, ...d] : d.map((x) => (x.id === list[0].id ? list[0] : x))));
    if (Array.isArray(r)) setCreated(r);
    setNote({ ok: true, text: `${isNew ? 'Rule added' : 'Rule saved'}. ${SYNC}` });
  }

  return (
    <>
      <PageHead title="Block list" sub="Websites employees can’t open on company computers. New rules reach every computer within 30 minutes."
        right={canEdit && <button className="btn pri" onClick={() => setEditing('new')}>Add rule</button>} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <PendingList resource={['block_rule', 'sensitive_domain']} />

      <Loaded s={rules}>{(data) => (
        <div className="card stack">
          <div className="toolbar">{L.search('Search rules, reasons or people')}</div>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Rule</th><th>Blocks</th><th>Reason</th><th>Added by</th><th>Added</th>{canEdit && <th><span className="sr-only">Actions</span></th>}</tr></thead>
              <tbody>
                {!L.rows.length ? <tr><td colSpan={6} className="muted">{data.length ? 'No rules match your search.' : 'Nothing is blocked yet.'}</td></tr>
                  : L.rows.map((r) => (
                    <tr key={r.id}>
                      <td className="mono">{r.pattern}</td>
                      <td className="small">{BLOCKS[r.type]}{r.type === 'url' && <div className="muted">{GAP}</div>}</td>
                      <td>{r.reason || <span className="muted">—</span>}</td>
                      <td>{r.created_by_name ?? '—'}</td>
                      <td className="small muted" title={full(r.created_at, me.tz)}>{when(r.created_at, me.tz)}</td>
                      {canEdit && <td><div className="row">
                        <button className="btn sm" onClick={() => setEditing(r)}>Edit</button>
                        <ConfirmButton label="Delete" question={`Delete the rule for ${r.pattern}? Employees can open it again once computers update.`} onConfirm={() => remove(r)} />
                      </div></td>}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
          {L.pager}
        </div>
      )}</Loaded>

      <PrivateSites canEdit={me.role !== 'manager'} />

      <RuleDialog rule={editing} onClose={() => setEditing(null)} onSaved={saved} onSent={() => { setEditing(null); setNote({ ok: true, text: SENT }); }} />
      <Modal title="Rules created" open={!!created} onClose={() => setCreated(null)}>
        <div className="stack">
          <p>The pattern was turned into {created?.length === 1 ? 'this website rule' : 'these website rules'}:</p>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{created?.map((r) => <li key={r.id} className="mono">{r.pattern}</li>)}</ul>
          <p className="small muted">{GAP}</p>
          <div className="mf"><button className="btn pri" onClick={() => setCreated(null)}>Done</button></div>
        </div>
      </Modal>
    </>
  );
}

function RuleDialog({ rule, onClose, onSaved, onSent }: { rule: Rule | 'new' | null; onClose: () => void; onSaved: (r: Rule | Rule[], isNew: boolean) => void; onSent: () => void }) {
  const isNew = rule === 'new';
  const [type, setType] = useState<'domain' | 'url'>('domain');
  const [pattern, setPattern] = useState('');
  const [reason, setReason] = useState('');
  const [err, setErr] = useState<{ pattern?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (!rule) return;
    setErr({});
    if (rule === 'new') { setType('domain'); setPattern(''); setReason(''); }
    else { setType(rule.type); setPattern(rule.pattern); setReason(rule.reason ?? ''); }
  }, [rule]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = pattern.trim();
    const regex = isNew && looksRegex(p);
    setBusy(true); setErr({});
    const r = isNew
      ? await call<Rule | Rule[]>('POST', '/v1/block-rules', { type: regex ? 'regex' : type, pattern: p, reason: reason.trim() || undefined })
      : await call<Rule>('PATCH', `/v1/block-rules/${(rule as Rule).id}`, { pattern: p, reason: reason.trim() });
    setBusy(false);
    if (isPending(r)) return onSent();
    if (r.ok) return onSaved(r.data, isNew);
    if (r.status === 409) return setErr({ pattern: 'This rule already exists.' });
    if (r.status === 422 || r.status === 400) return setErr({ pattern: regex
      ? 'This pattern can’t be turned into website rules. Type the site and path instead, like reddit.com/r/.'
      : type === 'domain' ? 'Type just the website, like facebook.com.' : 'Type the site and path, like youtube.com/shorts.' });
    if (r.status === 404) return setErr({ form: 'This rule was already deleted.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={isNew ? 'Block a website' : 'Edit rule'} open={!!rule} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        {isNew && (
          <fieldset className="stack" style={{ border: 0, padding: 0, margin: 0, gap: 8 }}>
            <legend className="small" style={{ fontWeight: 500, marginBottom: 6 }}>What do you want to block?</legend>
            {([['domain', 'A whole website', 'Example: facebook.com. Also blocks m.facebook.com and other subdomains, in every browser and app.'],
              ['url', 'One part of a website', `Example: youtube.com/shorts. Works in Chrome, Edge, Safari and most browsers. ${GAP}`]] as const).map(([k, l, d]) => (
              <label key={k} className="radio-row">
                <input type="radio" name="bl-type" value={k} checked={type === k} onChange={() => setType(k)} />
                <span><b>{l}</b><br /><span className="small muted">{d}</span></span>
              </label>
            ))}
          </fieldset>
        )}
        <Field id="bl-pat" type="text" label="Website address" required maxLength={2048} autoFocus spellCheck={false} placeholder={type === 'url' ? 'youtube.com/shorts' : 'facebook.com'}
          value={pattern} error={err.pattern} onChange={(e) => setPattern(e.target.value)} />
        <Field id="bl-why" type="text" label="Reason (employees see this)" maxLength={120} placeholder="Not allowed on company computers"
          value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="small muted">{SYNC}</p>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : isNew ? 'Block it' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

function PrivateSites({ canEdit }: { canEdit: boolean }) {
  const sites = useData<Site[]>('/v1/sensitive-domains');
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [note, setNote] = useState<Note>(null);
  const L = useList(sites.data ?? [], (s) => `${s.pattern} ${s.is_default ? 'default' : ''}`, [25, 50, 100]);

  async function remove(s: Site) {
    const r = await call('DELETE', `/v1/sensitive-domains/${s.id}`);
    setRemoving(null);
    if (isPending(r)) return setNote({ ok: true, text: SENT });
    if (r.ok || r.status === 404) {
      sites.set((d) => d && d.filter((x) => x.id !== s.id));
      return setNote({ ok: true, text: r.ok ? `${s.pattern} was removed. ${SYNC}` : 'This site was already removed.' });
    }
    setNote({ ok: false, text: message(r.status, r.err.code) });
  }

  return (
    <div className="card stack">
      <div className="cardhead">
        <div>
          <h2>Private sites (never recorded)</h2>
          <p className="small muted">WorkBeat never records visits to these sites, and screenshots pause while they are open. Defaults cover banking, health and personal email.{!canEdit && ' Read-only. Your Company Admin sets these sites.'}</p>
        </div>
        <div className="row">{L.search('Search private sites')}{canEdit && <button className="btn" onClick={() => setAdding(true)}>Add site</button>}</div>
      </div>
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <Loaded s={sites}>{(data) => (
        <>
          <div className="row">
            {L.rows.map((s) => removing === s.id ? (
              <Confirm key={s.id} action="Remove" onCancel={() => setRemoving(null)} onConfirm={() => remove(s)}
                question={s.is_default
                  ? `Remove ${s.pattern}? WorkBeat will start recording visits to it, and this default will not be added back.`
                  : `Remove ${s.pattern}? WorkBeat will start recording visits to it.`} />
            ) : (
              <span key={s.id} className="chip">
                {s.pattern}{s.is_default && <span className="tag" style={{ fontFamily: 'inherit' }}>Default</span>}
                {canEdit && <button aria-label={`Remove ${s.pattern}`} onClick={() => setRemoving(s.id)}>×</button>}
              </span>
            ))}
            {!L.rows.length && <span className="muted small">{data.length ? 'No sites match.' : 'No private sites.'}</span>}
          </div>
          {L.pager}
        </>
      )}</Loaded>
      <SiteDialog open={adding} onClose={() => setAdding(false)}
        onSaved={(s) => { setAdding(false); sites.set((d) => d && [s, ...d]); setNote({ ok: true, text: `${s.pattern} added. ${SYNC}` }); }}
        onSent={() => { setAdding(false); setNote({ ok: true, text: SENT }); }} />
    </div>
  );
}

function SiteDialog({ open, onClose, onSaved, onSent }: { open: boolean; onClose: () => void; onSaved: (s: Site) => void; onSent: () => void }) {
  const [pattern, setPattern] = useState('');
  const [err, setErr] = useState<{ pattern?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setPattern(''); setErr({}); } }, [open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call<Site>('POST', '/v1/sensitive-domains', { pattern: pattern.trim() });
    setBusy(false);
    if (isPending(r)) return onSent();
    if (r.ok) return onSaved(r.data);
    if (r.status === 409) return setErr({ pattern: 'That site is already on the list.' });
    if (r.status === 422 || r.status === 400) return setErr({ pattern: 'Type just the website, like citybank.com.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Add a private site" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <p className="small">WorkBeat will never record visits to this site, and screenshots pause while it is open. Use it for banking, health or personal sites.</p>
        <Field id="sens-new" type="text" label="Website address" required maxLength={253} autoFocus spellCheck={false} placeholder="citybank.com"
          hint="Just the website name. It also covers its subdomains, like online.citybank.com."
          value={pattern} error={err.pattern} onChange={(e) => setPattern(e.target.value)} />
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Adding…' : 'Add site'}</button>
        </div>
      </form>
    </Modal>
  );
}
