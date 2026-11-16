'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { useMe } from '@/lib/me';
import { useData, Loaded } from '@/lib/use-data';
import { Confirm } from '@/components/confirm';

type Notice = { notice_text: string; notice_version: number };

/** Plain-text notice for signed copies, built in the browser (Plan-v3.5 §5.10). */
export function noticeTemplate(text: string, company: string, retentionDays: number) {
  return [
    `${company}: monitoring notice`, '',
    text.trim(), '',
    `Collected data is kept for ${retentionDays} days, then deleted.`,
    'Screenshots may be taken if your company has turned them on for you.', '',
    'I have read and understood this notice.', '',
    'Name: ______________________________', '',
    'Signature: _________________________', '',
    'Date: ______________________________', '',
  ].join('\n');
}

/**
 * Monitoring notice editor (D25). Company Admin only: mount it only for `company_admin`, since it
 * calls `GET /v1/settings/notice` on mount. `retentionDays` comes from the caller's company settings.
 */
export function NoticeEditor({ retentionDays }: { retentionDays: number }) {
  const me = useMe();
  const s = useData<Notice>('/v1/settings/notice');
  const [text, setText] = useState('');
  const [asking, setAsking] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  useEffect(() => { if (s.data) setText(s.data.notice_text); }, [s.data]);

  async function save() {
    setAsking(false); setErr(null);
    const r = await call<Notice>('PUT', '/v1/settings/notice', { notice_text: text });
    if (r.ok) { s.set(() => r.data); return setNote(`Saved as version ${r.data.notice_version}. Employees will be asked to acknowledge it on their computers.`); }
    setErr(r.status === 422 || r.status === 400 ? 'The notice can’t be empty or this long. Shorten it and try again.' : message(r.status, r.err.code));
  }

  function submit(e: React.FormEvent) {
    e.preventDefault(); setNote(null); setErr(null);
    if (!text.trim()) return setErr('Write the notice employees will see.');
    if (text === s.data?.notice_text) return setNote('Nothing changed. The notice is the same as before.');
    setAsking(true);
  }

  function download() {
    const url = URL.createObjectURL(new Blob([noticeTemplate(text, me.company?.name ?? 'Your company', retentionDays)], { type: 'text/plain' }));
    const a = Object.assign(document.createElement('a'), { href: url, download: 'monitoring-notice.txt' });
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="card stack">
      <div className="cardhead">
        <div>
          <h2>Monitoring notice</h2>
          <p className="small muted">Employees see this on their computer and acknowledge it.{s.data && ` Version ${s.data.notice_version}.`}</p>
        </div>
        <button type="button" className="btn" onClick={download} disabled={!s.data}>Download template</button>
      </div>
      <Loaded s={s}>{() => (
        <form className="stack" onSubmit={submit}>
          <div className="field">
            <label htmlFor="notice-text">Notice text</label>
            <textarea id="notice-text" rows={6} value={text} aria-invalid={!!err} aria-describedby={err ? 'notice-err' : undefined}
              onChange={(e) => { setText(e.target.value); setAsking(false); }} />
            {err && <span className="err" id="notice-err" role="alert">{err}</span>}
          </div>
          {note && <div className="notice ok" role="status">{note}</div>}
          {asking ? (
            <Confirm question="Every employee will be shown the new notice on their computer and asked to acknowledge it again." action="Save and ask again"
              onConfirm={save} onCancel={() => setAsking(false)} />
          ) : <div className="row"><button className="btn pri">Save notice</button></div>}
          <p className="small muted">The template adds the retention period, a screenshot line and name, signature and date lines, for signed copies before install.</p>
        </form>
      )}</Loaded>
    </div>
  );
}
