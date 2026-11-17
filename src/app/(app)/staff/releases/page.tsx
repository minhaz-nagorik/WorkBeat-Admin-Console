'use client';
import { useEffect, useState } from 'react';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { dateOnly } from '@/lib/time';
import { useList } from '@/components/list';
import { ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import { check, minimum, state, type Release } from './logic';

const PILL = { Current: 'p-ok', Supported: '', Withdrawn: 'p-bad' } as const;
const name = (r: Release) => `${label('product', r.product)} ${label('os', r.platform)} ${r.version}`;

export default function StaffReleases() {
  const s = useData<Release[]>('/v1/staff/agent-releases');
  const all = s.data ?? [];
  const L = useList(all, (r) => [label('product', r.product), label('os', r.platform), label('arch', r.arch), r.version, state(r, all)].join(' '));
  const [publishing, setPublishing] = useState(false);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function withdraw(r: Release) {
    const res = await call<Release>('POST', `/v1/staff/agent-releases/${r.id}/withdraw`);
    setNote(res.ok ? { ok: true, text: `${name(r)} was withdrawn.` } : { ok: false, text: message(res.status, res.err.code) });
    s.reload();
  }

  return (
    <>
      <PageHead title="Agent releases" sub="Installers available to customers. Computers below the minimum version are flagged as outdated."
        right={<button className="btn pri" onClick={() => setPublishing(true)}>Publish release</button>} />
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
      <Loaded s={s}>{(rs) => (
        <>
          <div className="card stack">
            <h2>Minimum supported version</h2>
            <div className="grid g2">
              {(['macos', 'windows'] as const).map((p) => (
                <div key={p} className="stat"><span className="label">{label('os', p)} minimum</span><span className="v mono">{minimum(rs, p) ?? 'None yet'}</span></div>
              ))}
            </div>
            <p className="small muted">Set by the newest live agent release of each platform. Computers below it are flagged outdated and update themselves.</p>
          </div>
          <div className="card stack">
            <div className="toolbar">{L.search('Search releases')}</div>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Product</th><th>Platform</th><th>Version</th><th>Minimum</th><th>Released (UTC)</th><th>State</th><th><span className="sr-only">Actions</span></th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={7} className="muted">{rs.length ? 'No release matches.' : 'No releases yet.'}</td></tr>
                    : L.rows.map((r) => {
                      const st = state(r, rs);
                      return (
                        <tr key={r.id}>
                          <td>{label('product', r.product)}</td>
                          <td>{label('os', r.platform)} <span className="small muted">{label('arch', r.arch)}</span></td>
                          <td className="mono">{r.version}</td>
                          <td className="mono">{r.min_supported}</td>
                          <td>{dateOnly(r.released_at, 'UTC')}</td>
                          <td><span className={`pill ${PILL[st]}`}>{st}</span></td>
                          <td>{st !== 'Withdrawn' && (
                            <ConfirmButton label="Withdraw" onConfirm={() => withdraw(r)}
                              question={`Withdraw ${name(r)}? It will no longer be offered for download or update.`} />
                          )}</td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
            {L.pager}
          </div>
        </>
      )}</Loaded>
      <PublishDialog open={publishing} onClose={() => setPublishing(false)}
        onDone={(r) => { setPublishing(false); setNote({ ok: true, text: `${name(r)} is published.` }); s.reload(); }} />
    </>
  );
}

async function sha256(f: File) {
  const h = await crypto.subtle.digest('SHA-256', await f.arrayBuffer());
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, '0')).join('');
}

function PublishDialog({ open, onClose, onDone }: { open: boolean; onClose: () => void; onDone: (r: Release) => void }) {
  const blank = { product: 'agent', platform: 'macos', arch: 'universal', version: '', min_supported: '', signature: '', release_notes: '' };
  const [f, setF] = useState(blank);
  const [file, setFile] = useState<File | null>(null);
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [uploadFailed, setUploadFailed] = useState(false);
  useEffect(() => { if (open) { setF(blank); setFile(null); setErr({}); setUploadFailed(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (k: keyof typeof blank) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const fe = check({ ...f, file });
    setErr(fe);
    if (Object.keys(fe).length || !file) return;
    setUploadFailed(false);
    const { product, platform, arch, version } = f;
    setBusy('Uploading…');
    const u = await call<{ upload_url: string; storage_path: string }>('POST', '/v1/staff/agent-releases/upload-url', { product, platform, arch, version });
    if (!u.ok) { setBusy(null); return setErr({ form: u.status === 409 ? 'This version is already published for that platform.' : message(u.status, u.err.code) }); }
    // Signed storage URL, straight from the browser; never logged or kept (rule 4).
    const put = await fetch(u.data.upload_url, { method: 'PUT', headers: { 'content-type': 'application/octet-stream' }, body: file }).catch(() => null);
    if (!put?.ok) { setBusy(null); setUploadFailed(true); return setErr({ form: 'The upload failed. Nothing was published.' }); }
    setBusy('Publishing…');
    const r = await call<Release>('POST', '/v1/staff/agent-releases', {
      product, platform, arch, version, min_supported: f.min_supported, storage_path: u.data.storage_path,
      sha256: await sha256(file), size_bytes: file.size,
      ...(platform === 'macos' && { signature: f.signature.trim() }), // Windows MSIs are unsigned (W35): omitted
      ...(f.release_notes.trim() && { release_notes: f.release_notes.trim() }),
    });
    setBusy(null);
    if (r.ok) return onDone(r.data);
    if (r.status === 409) return setErr({ form: 'This version is already published for that platform.' });
    if (r.status === 422 || r.status === 400) return setErr({ form: 'The API refused this release: check the architecture, versions and that the file finished uploading.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title="Publish release" open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <div className="grid g2">
          <div className="field"><label htmlFor="rl-product">Product</label>
            <select id="rl-product" value={f.product} onChange={set('product')}>
              <option value="agent">{label('product', 'agent')}</option><option value="downloader">{label('product', 'downloader')}</option>
            </select></div>
          <div className="field"><label htmlFor="rl-platform">Platform</label>
            <select id="rl-platform" value={f.platform} onChange={(e) => setF({ ...f, platform: e.target.value, arch: e.target.value === 'macos' ? 'universal' : 'x64' })}>
              <option value="macos">macOS</option><option value="windows">Windows</option>
            </select></div>
        </div>
        <div className="field"><label htmlFor="rl-arch">Architecture</label>
          <select id="rl-arch" value={f.arch} onChange={set('arch')} disabled={f.platform === 'macos'} aria-invalid={!!err.arch}>
            {f.platform === 'macos' ? <option value="universal">{label('arch', 'universal')}</option>
              : <><option value="x64">{label('arch', 'x64')}</option><option value="arm64">{label('arch', 'arm64')}</option></>}
          </select>
          {f.platform === 'macos' && <span className="hint">macOS releases are always Universal.</span>}
          {err.arch && <span className="err" role="alert">{err.arch}</span>}
        </div>
        <div className="grid g2">
          <Field id="rl-version" label="Version" placeholder="1.0.5" required value={f.version} error={err.version} onChange={set('version')} />
          <Field id="rl-min" label="Minimum supported" placeholder="1.0.3" required value={f.min_supported} error={err.min_supported}
            hint="Not above the version." onChange={set('min_supported')} />
        </div>
        <div className="field"><label htmlFor="rl-file">Installer file</label>
          <input id="rl-file" type="file" accept=".pkg,.dmg,.msi,.exe" aria-invalid={!!err.file} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          {err.file && <span className="err" role="alert">{err.file}</span>}
        </div>
        {f.platform === 'macos' && (
          <div className="field"><label htmlFor="rl-sig">Signature</label>
            <textarea id="rl-sig" rows={3} className="mono" value={f.signature} onChange={set('signature')} aria-invalid={!!err.signature} />
            {err.signature ? <span className="err" role="alert">{err.signature}</span> : <span className="hint">Required for macOS. Windows installers are unsigned.</span>}
          </div>
        )}
        <div className="field"><label htmlFor="rl-notes">Release notes (optional)</label>
          <textarea id="rl-notes" rows={3} value={f.release_notes} onChange={set('release_notes')} /></div>
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={!!busy}>{busy ?? (uploadFailed ? 'Retry upload' : 'Upload and publish')}</button>
        </div>
      </form>
    </Modal>
  );
}
