'use client';
// WorkBeat private sites (workbeat-private-sites, A19): never recorded at every company; companies see them read-only.
import { useState } from 'react';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { when } from '@/lib/time';
import { useList } from '@/components/list';
import { ConfirmButton } from '@/components/confirm';
import { SiteDialog, type Site } from '@/components/policies/site-dialog';

const PATH = '/v1/staff/sensitive-domains';
const SYNC = "Every company's computers update within 30 minutes.";

export default function StaffPrivateSites() {
  const sites = useData<Site[]>(PATH);
  const L = useList(sites.data ?? [], (s) => `${s.pattern} ${s.created_by_name ?? ''}`);
  const [adding, setAdding] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function remove(s: Site) {
    const r = await call('DELETE', `${PATH}/${s.id}`);
    if (r.ok || r.status === 404) sites.set((d) => d && d.filter((x) => x.id !== s.id));
    setNote(r.ok ? { ok: true, text: `${s.pattern} was removed. ${SYNC}` }
      : r.status === 404 ? { ok: true, text: 'This site was already removed.' } : { ok: false, text: message(r.status, r.err.code) });
  }

  return (
    <>
      <PageHead title="WorkBeat private sites" sub="WorkBeat never records visits to these sites at any company, and screenshots pause while they are open. Companies see them on their Block list but can't change them."
        right={<button className="btn pri" onClick={() => setAdding(true)}>Add site</button>} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <div className="card stack">
        <div className="toolbar">{L.search('Search sites')}</div>
        <Loaded s={sites}>{(data) => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Website</th><th>Added by</th><th>Added (UTC)</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={4} className="muted">{data.length ? 'No site matches.' : 'No WorkBeat private sites yet.'}</td></tr>
                    : L.rows.map((s) => (
                      <tr key={s.id}>
                        <td className="mono">{s.pattern}</td>
                        <td>{s.created_by_name ?? '—'}</td>
                        <td className="small">{when(s.created_at, 'UTC')}</td>
                        <td><ConfirmButton label="Remove" question={`Remove ${s.pattern}? WorkBeat will start recording visits to it at every company, unless a company has it on its own list.`} onConfirm={() => remove(s)} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>
      </div>
      <SiteDialog open={adding} path={PATH} onClose={() => setAdding(false)}
        intro="WorkBeat will never record visits to this site at any company, and screenshots pause while it is open. Companies can't remove it."
        onSaved={(s) => { setAdding(false); sites.set((d) => d && [s, ...d]); setNote({ ok: true, text: `${s.pattern} added. ${SYNC}` }); }} />
    </>
  );
}
