'use client';
// Installer downloads and install steps: on Deployment (Company Admin) and Downloads (IT Admin).
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { call, message } from '@/lib/client';
import { markStep } from './deploy';

type Download = { product: 'agent' | 'downloader'; platform: 'macos' | 'windows'; arch: string; version: string; size_bytes: number; url: string };
type Meta = Omit<Download, 'url'>;

export const StepHead = ({ n, title, sub }: { n: number; title: string; sub?: string }) => (
  <div className="stephead"><span className="n" aria-hidden="true">{n}</span><div><h2>{title}</h2>{sub && <p className="small muted">{sub}</p>}</div></div>
);
const strip = (l: Download[]): Meta[] => l.map((d) => { const m: Meta & { url?: string } = { ...d }; delete m.url; return m; });
const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

const SLOTS: [Download['product'], Download['platform'], string | null, string][] = [
  ['downloader', 'windows', null, 'WorkBeat Setup for Windows'],
  ['downloader', 'macos', null, 'WorkBeat Setup for Mac'],
  ['agent', 'windows', 'x64', 'WorkBeat agent for Windows (Intel/AMD)'],
  ['agent', 'windows', 'arm64', 'WorkBeat agent for Windows (ARM)'],
  ['agent', 'macos', 'universal', 'WorkBeat agent for Mac'],
];
const find = <T extends Meta>(list: T[], [p, os, arch]: (typeof SLOTS)[number]) =>
  list.find((d) => d.product === p && d.platform === os && (!arch || d.arch === arch));

export function Install({ itAdmin = false }: { itAdmin?: boolean }) {
  // Links are signed and short-lived: keep only the metadata, fetch a fresh link on click.
  const [meta, setMeta] = useState<Meta[] | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [failed, setFailed] = useState<number | null>(null);
  useEffect(() => {
    call<Download[]>('GET', '/v1/downloads').then((r) => r.ok ? setMeta(strip(r.data)) : setFailed(r.status || 500));
  }, []);

  async function download(slot: (typeof SLOTS)[number]) {
    setErr(null);
    const r = await call<Download[]>('GET', '/v1/downloads');
    if (!r.ok) return setErr(message(r.status, r.err.code));
    setMeta(strip(r.data));
    const d = find(r.data, slot);
    if (!d) return setErr('This download is not available yet.');
    if (slot[0] === 'downloader' && !itAdmin) markStep('download_downloader').catch(() => {});
    const a = document.createElement('a');
    a.href = d.url; a.rel = 'noopener'; a.click();
  }

  return (
    <div className="card stack" id="install">
      {itAdmin ? <h2>Install on your computers</h2> : <StepHead n={2} title="Install on your computers" sub="Run WorkBeat Setup once on each computer." />}
      <ol className="guide">
        <li>Download WorkBeat Setup for Windows or Mac below.</li>
        <li>On the employee’s computer, open it as an administrator.</li>
        <li>Paste your <b>licence key</b>{itAdmin ? ' (your Company Admin gives it to you)' : ' from step 1'}.</li>
        <li>Pick the employee who uses the computer. This is required: the computer is set up for that person and uses one seat. The employee must already be on the Employees page.</li>
        <li>Done. The computer shows up on the <Link href="/devices">Devices</Link> page within a minute.</li>
      </ol>
      <details>
        <summary className="small">Install with a script instead</summary>
        <div className="code" style={{ marginTop: 8 }}>WorkBeatSetup --license-key &lt;key&gt; --employee-email &lt;email&gt; --silent</div>
      </details>
      <div className="notice warn"><div>Someone with administrator rights on a computer can remove WorkBeat. Make employees standard users. You get an offline or tamper alert if a computer stops reporting.</div></div>
      <div id="downloads" className="tablewrap">
        <table>
          <thead><tr><th>Download</th><th>Version</th><th>Size</th><th><span className="sr-only">Action</span></th></tr></thead>
          <tbody>
            {SLOTS.map((slot) => {
              const d = meta && find(meta, slot);
              return (
                <tr key={slot[3]}>
                  <td>{slot[3]}{slot[0] === 'agent' && <div className="small muted">Only needed to repair or update by hand. WorkBeat Setup installs it.</div>}</td>
                  {!meta ? <td colSpan={3} className="muted small">{failed ? message(failed, '') : 'Loading…'}</td>
                    : !d ? <td colSpan={3} className="muted small">Not available yet</td> : (
                      <>
                        <td className="mono">{d.version}</td>
                        <td className="num">{mb(d.size_bytes)}</td>
                        <td><button className="btn sm" onClick={() => download(slot)}>Download<span className="sr-only"> {slot[3]}</span></button></td>
                      </>
                    )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {err && <div className="err" role="alert">{err}</div>}
    </div>
  );
}

