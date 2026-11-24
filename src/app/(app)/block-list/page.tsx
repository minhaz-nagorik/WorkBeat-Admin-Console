'use client';
import { can } from '@/lib/nav';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { useMe } from '@/lib/me';
import { when, full } from '@/lib/time';
import { useData, Loaded, PageHead } from '@/lib/use-data';
import { isPending, PendingList, SENT } from '@/components/pending';
import { useList } from '@/components/list';
import { Confirm, ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import { SiteDialog, type Site } from '@/components/policies/site-dialog';

type Rule = { id: string; type: 'domain' | 'url'; pattern: string; reason: string | null; created_at: string; created_by_name?: string | null };
type Note = { ok: boolean; text: string } | null;

const BLOCKS = { domain: 'Whole site and its subdomains, in every browser and app', url: 'Only this part of the site, in most browsers' };
const GAP = 'In Firefox on Mac and in Brave, Opera and Vivaldi on Windows only whole-website rules work.';
const SYNC = 'Computers update within 30 minutes.';

export default function BlockList() {
  const me = useMe();
  const canEdit = can(me, 'policy.edit');
  const rules = useData<Rule[]>('/v1/block-rules');
  const [note, setNote] = useState<Note>(null);
  const [editing, setEditing] = useState<Rule | 'new' | null>(null);
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

  function saved(r: Rule, isNew: boolean) {
    setEditing(null);
    rules.set((d) => d && (isNew ? [r, ...d] : d.map((x) => (x.id === r.id ? r : x))));
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

      <PrivateSites canEdit={canEdit} />

      <RuleDialog rule={editing} onClose={() => setEditing(null)} onSaved={saved} onSent={() => { setEditing(null); setNote({ ok: true, text: SENT }); }} />
    </>
  );
}

function RuleDialog({ rule, onClose, onSaved, onSent }: { rule: Rule | 'new' | null; onClose: () => void; onSaved: (r: Rule, isNew: boolean) => void; onSent: () => void }) {
  const isNew = rule === 'new';
  const [type, setType] = useState<'domain' | 'url'>('domain'); // url only when editing an older rule
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
    setBusy(true); setErr({});
    const r = isNew
      ? await call<Rule>('POST', '/v1/block-rules', { type: 'domain', pattern: p, reason: reason.trim() || undefined }) // whole websites only (A20)
      : await call<Rule>('PATCH', `/v1/block-rules/${(rule as Rule).id}`, { pattern: p, reason: reason.trim() });
    setBusy(false);
    if (isPending(r)) return onSent();
    if (r.ok) return onSaved(r.data, isNew);
    if (r.status === 409) return setErr({ pattern: 'This rule already exists.' });
    if (r.status === 422 || r.status === 400) return setErr({ pattern: type === 'domain' ? 'Type just the website, like facebook.com.' : 'Type the site and path, like youtube.com/shorts.' });
    if (r.status === 404) return setErr({ form: 'This rule was already deleted.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={isNew ? 'Block a website' : 'Edit rule'} open={!!rule} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <Field id="bl-pat" type="text" label="Website address" required maxLength={2048} autoFocus spellCheck={false} placeholder={type === 'url' ? 'youtube.com/shorts' : 'facebook.com'}
          hint={type === 'domain' ? 'Blocks the whole website and its subdomains, like m.facebook.com, in every browser and app.' : undefined}
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
  const L = useList(sites.data ?? [], (s) => `${s.pattern} ${s.is_default ? 'default' : ''} ${s.source === 'workbeat' ? 'set by workbeat' : ''}`, [25, 50, 100]);

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
          <p className="small muted">WorkBeat never records visits to these sites, and screenshots pause while they are open. Defaults cover banking, health and personal email. Sites marked Set by WorkBeat apply to every company and can&apos;t be changed here.{!canEdit && ' Read-only. Your Company Admin sets these sites.'}</p>
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
                {s.pattern}{s.source === 'workbeat' ? <span className="tag" style={{ fontFamily: 'inherit' }}>Set by WorkBeat</span>
                  : s.is_default && <span className="tag" style={{ fontFamily: 'inherit' }}>Default</span>}
                {canEdit && s.source !== 'workbeat' && <button aria-label={`Remove ${s.pattern}`} onClick={() => setRemoving(s.id)}>×</button>}
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
