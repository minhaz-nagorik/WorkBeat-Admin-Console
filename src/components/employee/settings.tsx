'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { call, message } from '@/lib/client';
import { useData, Loaded } from '@/lib/use-data';
import { label } from '@/lib/labels';
import type { TabProps } from './tabs';

type Settings = { activity: boolean; app_usage: boolean; window_titles: boolean; website_visits: boolean; screenshot_interval_seconds: number };
type Switch = 'activity' | 'app_usage' | 'window_titles' | 'website_visits';
const SWITCHES: [Switch, string, string][] = [
  ['activity', 'Activity', 'Whether the keyboard or mouse was used. What is typed is never recorded.'],
  ['app_usage', 'App usage', 'Which apps are used, and for how long.'],
  ['window_titles', 'Window titles', 'The title of the window in use, such as a document name.'],
  ['website_visits', 'Website visits', 'Which websites are visited, and for how long. Private sites are never recorded.'],
];
// Choices no faster than the company's screenshot tier (B11).
const BY_TIER: Record<string, number[]> = { off: [0], light: [0, 3600], standard: [0, 1800, 3600], intensive: [0, 600, 1800, 3600] };

export function MonitoringSettingsTab({ employeeId, role, archived }: TabProps) {
  const admin = role === 'company_admin';
  const edit = admin && !archived;
  const s = useData<Settings>(`/v1/employees/${employeeId}/monitoring-settings`);
  const bill = useData<{ screenshot_tier: string }>(edit ? '/v1/billing' : null); // managers never call billing
  const [f, setF] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [ivErr, setIvErr] = useState<string | null>(null);
  useEffect(() => { setF(s.data); }, [s.data]);

  const tier = bill.data?.screenshot_tier;
  const choices = tier ? BY_TIER[tier] ?? [0] : [];

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!f || !s.data) return;
    const old = s.data;
    setBusy(true); setNote(null); setIvErr(null);
    const r = await call<Settings>('PUT', `/v1/employees/${employeeId}/monitoring-settings`, f);
    setBusy(false);
    if (r.ok) {
      s.set(() => r.data);
      const on = SWITCHES.filter(([k]) => r.data[k] && !old[k]);
      const off = SWITCHES.filter(([k]) => !r.data[k] && old[k]).map(([, l]) => l.toLowerCase());
      const iv = r.data.screenshot_interval_seconds, was = old.screenshot_interval_seconds;
      const wider = on.length > 0 || (iv > 0 && (was === 0 || iv < was));
      return setNote({ ok: true, text: [
        'Saved. The change reaches their computers within 30 minutes.',
        off.length ? `Collection of ${off.join(', ')} stops.` : '',
        iv === 0 && was > 0 ? 'Screenshots stop.' : '',
        wider ? 'They will be asked to acknowledge the monitoring notice again.' : '',
      ].filter(Boolean).join(' ') });
    }
    if (r.status === 422) { setF(old); setIvErr("That interval isn't allowed on your plan"); return bill.reload(); }
    if (r.status === 409) return setNote({ ok: false, text: 'This employee was removed, so their settings can’t be changed.' });
    setNote({ ok: false, text: message(r.status, r.err.code) });
  }

  return (
    <Loaded s={s}>{() => !f ? null : (
      <form className="card stack" onSubmit={save}>
        <div><h2>What is collected</h2>
          <p className="small muted">{edit ? 'Choose what WorkBeat collects from this person’s computers.' : 'What WorkBeat collects from this person’s computers. Only a Company Admin can change it.'}</p></div>
        {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
        {SWITCHES.map(([k, l, d]) => (
          <div key={k} className="row between" style={{ flexWrap: 'nowrap' }}>
            <div><b id={`ms-${k}`}>{l}</b><div className="small muted">{d}</div></div>
            <button type="button" role="switch" aria-checked={f[k]} aria-labelledby={`ms-${k}`} disabled={!edit}
              className={`mock-toggle ${f[k] ? 'on' : ''}`} onClick={() => setF({ ...f, [k]: !f[k] })} />
            <span className="small" aria-hidden="true" style={{ minWidth: 24 }}>{f[k] ? 'On' : 'Off'}</span>
          </div>
        ))}
        <div className="field" style={{ maxWidth: 280 }}>
          <label htmlFor="ms-iv">Screenshots</label>
          {!edit ? <span id="ms-iv">{label('interval', String(f.screenshot_interval_seconds))}</span> : (
            <select id="ms-iv" value={f.screenshot_interval_seconds} disabled={!tier} aria-invalid={!!ivErr} aria-describedby={ivErr ? 'ms-iv-err' : undefined}
              onChange={(e) => { setF({ ...f, screenshot_interval_seconds: +e.target.value }); setIvErr(null); }}>
              {/* keep the stored value visible even if the tier no longer allows it */}
              {[...new Set([...choices, f.screenshot_interval_seconds])].sort((a, b) => a - b)
                .map((v) => <option key={v} value={v} disabled={!choices.includes(v)}>{label('interval', String(v))}</option>)}
            </select>
          )}
          {ivErr && <span className="err" id="ms-iv-err" role="alert">{ivErr}</span>}
          {edit && tier === 'off' && <span className="hint">Your plan doesn&apos;t include screenshots. <Link href="/company-settings#billing">Billing</Link></span>}
        </div>
        {edit && <div className="row"><button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button></div>}
      </form>
    )}</Loaded>
  );
}
