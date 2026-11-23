'use client';
import { can } from '@/lib/nav';
import { useMe } from '@/lib/me';
import { isPending, PendingList, SENT } from '@/components/pending';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { useData, Loaded } from '@/lib/use-data';
import { label, options } from '@/lib/labels';
import { dayKey, when } from '@/lib/time';
import { hm } from '@/lib/format';
import { ConfirmButton, Modal } from '@/components/confirm';
import type { TabProps } from './tabs';

type Pause = {
  id: string; starts_at: string; ends_at: string; reason: string; note: string | null;
  created_by_name: string | null; status: 'scheduled' | 'active' | 'ended' | 'cancelled';
};
const PILL = { scheduled: 'p-warn', active: 'p-info', ended: '', cancelled: 'plain' };
const WHAT = 'While paused nothing is collected: no apps, websites, activity or screenshots. Website blocking is lifted. Tamper alerts keep working. The tray or menu bar icon shows that monitoring is paused and until when. The seat stays billed.';

// Wall clock "YYYY-MM-DDTHH:mm" in the company zone (A9) <-> instant.
const wall = (d: Date, tz: string) => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
    .formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;
};
const instant = (w: string, tz: string) => {
  const guess = Date.parse(w + ':00Z');
  return new Date(guess - (Date.parse(wall(new Date(guess), tz) + ':00Z') - guess));
};
const length = (a: string, b: string) => {
  const s = (Date.parse(b) - Date.parse(a)) / 1000, d = Math.floor(s / 86400);
  return d ? `${d} ${d === 1 ? 'day' : 'days'}${s % 86400 >= 60 ? ` ${hm(s % 86400)}` : ''}` : hm(s);
};

export function PausesTab({ employeeId, tz, archived }: TabProps) {
  const act = can(useMe(), 'employees.edit') && !archived; // a member's changes wait for approval
  const s = useData<Pause[]>(`/v1/employees/${employeeId}/pauses`, { poll: true });
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [extending, setExtending] = useState<string | null>(null);
  const [end, setEnd] = useState('');
  const [extErr, setExtErr] = useState<string | null>(null);
  const base = `/v1/employees/${employeeId}/pauses`;
  const gone = 'This pause already ended or was cancelled.';

  async function cancel(p: Pause) {
    const r = await call<Pause>('POST', `${base}/${p.id}/cancel`);
    if (isPending(r)) return setNote({ ok: true, text: SENT });
    setNote(r.ok ? { ok: true, text: p.status === 'active' ? 'Pause ended. Monitoring resumes on their computers.' : 'Pause cancelled.' }
      : { ok: false, text: r.status === 409 ? gone : message(r.status, r.err.code) });
    s.reload();
  }

  async function extend(p: Pause) {
    setExtErr(null);
    const r = await call<Pause>('PATCH', `${base}/${p.id}`, { ends_at: instant(end, tz).toISOString() });
    if (isPending(r)) { setExtending(null); return setNote({ ok: true, text: SENT }); }
    if (r.ok) { setExtending(null); setNote({ ok: true, text: `The pause now ends ${when(r.data.ends_at, tz)}.` }); return s.reload(); }
    if (r.status === 422 || r.status === 400) return setExtErr('The new end must be after now and after the start.');
    if (r.status === 409) { setExtending(null); setNote({ ok: false, text: `${gone} Or the new end overlaps another pause.` }); return s.reload(); }
    setExtErr(message(r.status, r.err.code));
  }

  const sorted = [...(s.data ?? [])].sort((a, b) => b.starts_at.localeCompare(a.starts_at));
  return (
    <div className="card stack">
      <div className="cardhead">
        <div><h2>Pause monitoring</h2><p className="small muted">Take this person out of monitoring for a set time, such as leave. Every pause has an end.</p></div>
        {act && <button className="btn pri" onClick={() => setOpen(true)}>Schedule pause</button>}
      </div>
      <div className="notice info"><div>{WHAT}</div></div>
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <PendingList resource="pause" />
      <Loaded s={s}>{() => (
        <div className="tablewrap"><table>
          <thead><tr><th>When</th><th>Length</th><th>Reason</th><th>Status</th><th>Scheduled by</th>{act && <th><span className="sr-only">Actions</span></th>}</tr></thead>
          <tbody>
            {!sorted.length ? <tr><td colSpan={act ? 6 : 5} className="muted">No pauses yet.</td></tr> : sorted.map((p) => (
              <tr key={p.id}>
                <td className="small">{when(p.starts_at, tz)} → {when(p.ends_at, tz)}</td>
                <td className="num">{length(p.starts_at, p.ends_at)}</td>
                <td>{label('pauseReason', p.reason)}{p.note && <div className="small muted">{p.note}</div>}</td>
                <td><span className={`pill ${PILL[p.status] ?? ''}`}>{label('pauseState', p.status)}</span></td>
                <td className="small">{p.created_by_name ?? 'a removed user'}</td>
                {act && <td>{(p.status === 'active' || p.status === 'scheduled') && (extending === p.id ? (
                  <div className="stack" style={{ gap: 6 }}>
                    <label className="small" htmlFor={`ext-${p.id}`}>New end ({tz})</label>
                    <input id={`ext-${p.id}`} type="datetime-local" value={end} min={wall(new Date(), tz)} onChange={(e) => setEnd(e.target.value)}
                      aria-invalid={!!extErr} aria-describedby={extErr ? `ext-${p.id}-err` : undefined} />
                    {extErr && <span className="err" id={`ext-${p.id}-err`} role="alert">{extErr}</span>}
                    <div className="row">
                      <button className="btn sm" onClick={() => setExtending(null)}>Cancel</button>
                      <button className="btn sm pri" disabled={!end} onClick={() => extend(p)}>Save new end</button>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <button className="btn sm" onClick={() => { setExtending(p.id); setEnd(wall(new Date(p.ends_at), tz)); setExtErr(null); }}>Extend</button>
                    {p.status === 'active'
                      ? <ConfirmButton label="End now" question="End this pause now? Monitoring resumes on their computers." onConfirm={() => cancel(p)} />
                      : <ConfirmButton label="Cancel pause" action="Cancel pause" question="Cancel this pause? It won’t start." onConfirm={() => cancel(p)} />}
                  </div>
                ))}</td>}
              </tr>
            ))}
          </tbody>
        </table></div>
      )}</Loaded>
      {act && <PauseDialog open={open} tz={tz} base={base} onClose={() => setOpen(false)}
        onDone={(p) => { setOpen(false); setNote({ ok: true, text: `Pause scheduled: ${when(p.starts_at, tz)} to ${when(p.ends_at, tz)}.` }); s.reload(); }}
        onSent={() => { setOpen(false); setNote({ ok: true, text: SENT }); }} />}
    </div>
  );
}

function PauseDialog({ open, tz, base, onClose, onDone, onSent }: { open: boolean; tz: string; base: string; onClose: () => void; onDone: (p: Pause) => void; onSent: () => void }) {
  const [f, setF] = useState({ start: '', end: '', reason: 'annual_leave', note: '' });
  const [err, setErr] = useState<{ start?: string; end?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setF({ start: wall(new Date(), tz), end: '', reason: 'annual_leave', note: '' }); setErr({}); } }, [open, tz]);

  function preset(k: 'rest' | 'tomorrow' | 'week') {
    const now = new Date(), tomorrow = dayKey(new Date(now.getTime() + 864e5), tz);
    if (k === 'rest') setF({ ...f, start: wall(now, tz), end: `${dayKey(now, tz)}T23:59` });
    if (k === 'tomorrow') setF({ ...f, start: `${tomorrow}T00:00`, end: `${tomorrow}T23:59` });
    if (k === 'week') setF({ ...f, start: wall(now, tz), end: wall(new Date(now.getTime() + 7 * 864e5), tz) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!f.end) return setErr({ end: 'Choose when the pause ends.' });
    const start = instant(f.start, tz), end = instant(f.end, tz);
    if (end <= start) return setErr({ end: 'The end must be after the start.' });
    setBusy(true); setErr({});
    // A start within the current minute means "now": let the server stamp it so it is never in the past.
    const startsNow = start.getTime() <= Date.now();
    const r = await call<Pause>('POST', base, {
      ...(startsNow ? {} : { starts_at: start.toISOString() }), ends_at: end.toISOString(), reason: f.reason, ...(f.note.trim() ? { note: f.note.trim() } : {}),
    });
    setBusy(false);
    if (isPending(r)) return onSent();
    if (r.ok) return onDone(r.data);
    if (r.status === 409) return setErr({ form: 'This pause overlaps another pause. Change the dates or extend the other pause.' });
    if (r.status === 422 || r.status === 400) return setErr({ form: "The start can't be in the past, and the end must be after the start." });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Schedule pause" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <div className="row" role="group" aria-label="Quick choices">
          <button type="button" className="btn sm" onClick={() => preset('rest')}>Rest of today</button>
          <button type="button" className="btn sm" onClick={() => preset('tomorrow')}>Tomorrow</button>
          <button type="button" className="btn sm" onClick={() => preset('week')}>Next 7 days</button>
        </div>
        <div className="grid g2">
          <div className="field"><label htmlFor="pz-start">Starts ({tz})</label>
            <input id="pz-start" type="datetime-local" required value={f.start} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
          <div className="field"><label htmlFor="pz-end">Ends ({tz})</label>
            <input id="pz-end" type="datetime-local" required value={f.end} min={f.start} aria-invalid={!!err.end} aria-describedby={err.end ? 'pz-end-err' : undefined}
              onChange={(e) => setF({ ...f, end: e.target.value })} />
            {err.end && <span className="err" id="pz-end-err" role="alert">{err.end}</span>}</div>
        </div>
        <div className="grid g2">
          <div className="field"><label htmlFor="pz-reason">Reason</label>
            <select id="pz-reason" value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })}>
              {options('pauseReason').map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select></div>
          <div className="field"><label htmlFor="pz-note">Note (optional)</label>
            <input id="pz-note" maxLength={500} value={f.note} onChange={(e) => setF({ ...f, note: e.target.value })} /><span className="hint">Seen by admins and their manager.</span></div>
        </div>
        <div className="notice info"><div>{WHAT} A pause can&apos;t start in the past.</div></div>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Scheduling…' : 'Schedule pause'}</button>
        </div>
      </form>
    </Modal>
  );
}
