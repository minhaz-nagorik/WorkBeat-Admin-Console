'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label, options } from '@/lib/labels';
import { Modal } from '@/components/confirm';

export type AlertEmail = { roles: string[]; types: string[]; delivery: 'instant' | 'hourly' | 'daily' };

const ROLES = options('alertRole');
const WHEN = { instant: 'as they happen', hourly: 'as an hourly digest', daily: 'as a daily digest at 09:00' };

/** "Emails go to Company Admins and IT Admins, as they happen." */
export function emailSentence(m: AlertEmail) {
  const names = ROLES.filter(([k]) => m.roles.includes(k)).map(([k]) => (k === 'manager' ? 'Managers' : label('alertRole', k)));
  if (!names.length) return 'Alert emails go to nobody.';
  const to = names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}` : names[0];
  return `Emails go to ${to}, ${WHEN[m.delivery]}.`;
}

export function EmailSettings({ open, value, onClose, onSaved }: {
  open: boolean; value: AlertEmail; onClose: () => void; onSaved: (v: AlertEmail) => void;
}) {
  const [v, setV] = useState(value);
  const [err, setErr] = useState<{ roles?: string; types?: string; delivery?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setV(value); setErr({}); } }, [open, value]);

  const toggle = (key: 'roles' | 'types', k: string, on: boolean) =>
    setV((x) => ({ ...x, [key]: on ? [...x[key], k] : x[key].filter((y) => y !== k) }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const local = {
      roles: v.roles.length ? undefined : 'Pick at least one group, or alerts will go unseen.',
      types: v.types.length ? undefined : 'Pick at least one alert type, or alerts will go unseen.',
    };
    if (local.roles || local.types) return setErr(local);
    setBusy(true); setErr({});
    const r = await call<{ alert_email: AlertEmail }>('PATCH', '/v1/company/settings', { alert_email: v });
    setBusy(false);
    if (r.ok) return onSaved(r.data?.alert_email ?? v);
    if (r.status === 422 || r.status === 400) {
      const f = (r.err.fields ?? []).join(' ');
      const bad = 'This choice was not accepted. Check it and try again.';
      return setErr(f.includes('roles') ? { roles: bad } : f.includes('types') ? { types: bad } : f.includes('delivery') ? { delivery: bad } : { form: bad });
    }
    setErr({ form: message(r.status, r.err.code) });
  }

  const group = (key: 'roles' | 'types', legend: string, opts: [string, string][]) => (
    <fieldset className="field" style={{ border: 0, padding: 0, margin: 0 }} aria-describedby={err[key] ? `am-${key}-err` : undefined}>
      <legend className="small" style={{ fontWeight: 500, marginBottom: 6 }}>{legend}</legend>
      <div className="checks">
        {opts.map(([k, l]) => (
          <label key={k}><input type="checkbox" checked={v[key].includes(k)} onChange={(e) => toggle(key, k, e.target.checked)} /> {l}</label>
        ))}
      </div>
      {err[key] && <span className="err" id={`am-${key}-err`} role="alert">{err[key]}</span>}
    </fieldset>
  );

  return (
    <Modal title="Alert emails" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        {group('roles', 'Send to', ROLES)}
        {group('types', 'Alert types', options('alert'))}
        <div className="field">
          <label htmlFor="am-when">Delivery</label>
          <select id="am-when" value={v.delivery} aria-invalid={!!err.delivery} onChange={(e) => setV({ ...v, delivery: e.target.value as AlertEmail['delivery'] })}>
            {options('delivery').map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
          {err.delivery && <span className="err" role="alert">{err.delivery}</span>}
        </div>
        <p className="small muted">An alert email names only the alert, the computer, the person and the time. It never includes a website, window title or screenshot.</p>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}
