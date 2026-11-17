'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { call, message } from '@/lib/client';
import { label } from '@/lib/labels';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { markStep, RolloutCard, SetupChecklist } from '@/components/deploy';

type License = { key_masked: string; plan: string; seat_limit: number | null; seats_used: number; key_reset_at: string | null };
type Download = { product: 'agent' | 'downloader'; platform: 'macos' | 'windows'; arch: string; version: string; size_bytes: number; url: string };
type Meta = Omit<Download, 'url'>;

const StepHead = ({ n, title, sub }: { n: number; title: string; sub?: string }) => (
  <div className="stephead"><span className="n" aria-hidden="true">{n}</span><div><h2>{title}</h2>{sub && <p className="small muted">{sub}</p>}</div></div>
);
const strip = (l: Download[]): Meta[] => l.map((d) => { const m: Meta & { url?: string } = { ...d }; delete m.url; return m; });
const mb = (b: number) => `${(b / 1048576).toFixed(1)} MB`;

export default function Deployment() {
  const lic = useData<License>('/v1/license');
  return (
    <>
      <PageHead title="Deployment" sub="Put WorkBeat on your company computers in three steps." />
      <SetupChecklist />
      <div className="card stack" id="key">
        <StepHead n={1} title="Get your licence key" sub="WorkBeat Setup asks for it so it knows the computer belongs to your company. It is the only key you need." />
        <Loaded s={lic}>{(l) => (
          <div className="grid g2">
            <Secret title="Licence key" masked={l.key_masked} path="/v1/license/reveal" pick={(d) => (d as { key: string }).key}
              onUse={() => markStep('copy_license_key').catch(() => {})}
              intro="Your company’s key. It works on any computer while a seat is free."
              outro="It is the only install credential. Keep it private: if it leaks, only WorkBeat support can replace it. Computers already installed keep working." />
            <div className="keybox stack">
              <div className="row between"><h3>Seats</h3><span className="pill">{l.seats_used} of {l.seat_limit ?? 'unlimited'} used</span></div>
              <p className="small">Each installed computer uses one seat. When all seats are used, the key installs nothing more until one is free.</p>
              {l.seat_limit !== null && l.seats_used >= l.seat_limit && (
                <div className="notice warn" role="status">All seats are used. No more computers can be installed until a seat is freed.</div>
              )}
              <p className="small muted">Releasing or deactivating a computer on the <Link href="/devices">Devices</Link> page frees its seat at once.</p>
            </div>
          </div>
        )}</Loaded>
      </div>
      <Install />
      <Uninstall />
      <MinVersion />
      <RolloutCard head={<StepHead n={3} title="Check your computers" sub="Click a row to see those computers." />} />
    </>
  );
}

/** Masked secret with Show, Hide and Copy. The value lives in this component's memory only (A6). */
function Secret({ title, masked, path, pick, intro, outro, onUse }: {
  title: string; masked: string; path: string; pick: (d: unknown) => string; intro: string; outro: string; onUse?: () => void;
}) {
  const [value, setValue] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);
  async function fetchIt() {
    const r = await call<unknown>('POST', path);
    if (!r.ok) { setNote(message(r.status, r.err.code)); return null; }
    onUse?.();
    return pick(r.data);
  }
  async function show() { const v = await fetchIt(); if (v) { setValue(v); setNote(null); } }
  async function copy() {
    const v = value ?? await fetchIt();
    if (!v) return;
    try { await navigator.clipboard.writeText(v); setNote('Copied.'); } catch { setNote("Couldn't copy. Show it and copy it by hand."); }
  }
  return (
    <div className="keybox stack">
      <h3>{title}</h3>
      <p className="small">{intro}</p>
      <div className="secret" aria-label={value ? title : `${title}, hidden`}>{value ?? masked}</div>
      <div className="row">
        <button className="btn sm" onClick={() => (value ? setValue(null) : show())}>{value ? 'Hide' : 'Show'}</button>
        <button className="btn sm" onClick={copy}>Copy</button>
        {note && <span className="small muted" role="status">{note}</span>}
      </div>
      <p className="small muted">{outro}</p>
    </div>
  );
}

const SLOTS: [Download['product'], Download['platform'], string | null, string][] = [
  ['downloader', 'windows', null, 'WorkBeat Setup for Windows'],
  ['downloader', 'macos', null, 'WorkBeat Setup for Mac'],
  ['agent', 'windows', 'x64', 'WorkBeat agent for Windows (Intel/AMD)'],
  ['agent', 'windows', 'arm64', 'WorkBeat agent for Windows (ARM)'],
  ['agent', 'macos', 'universal', 'WorkBeat agent for Mac'],
];
const find = <T extends Meta>(list: T[], [p, os, arch]: (typeof SLOTS)[number]) =>
  list.find((d) => d.product === p && d.platform === os && (!arch || d.arch === arch));

function Install() {
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
    if (slot[0] === 'downloader') markStep('download_downloader').catch(() => {});
    const a = document.createElement('a');
    a.href = d.url; a.rel = 'noopener'; a.click();
  }

  return (
    <div className="card stack" id="install">
      <StepHead n={2} title="Install on your computers" sub="Run WorkBeat Setup once on each computer." />
      <ol className="guide">
        <li>Download WorkBeat Setup for Windows or Mac below.</li>
        <li>On the employee’s computer, open it as an administrator.</li>
        <li>Paste your <b>licence key</b> from step 1.</li>
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

function Uninstall() {
  return (
    <div className="card stack">
      <div><h2>Uninstall</h2><p className="small muted">Removing WorkBeat needs administrator rights on the computer and your company’s uninstall token. It frees the computer’s seat.</p></div>
      <Secret title="Uninstall token" masked="wbu_••••••••••••" path="/v1/license/uninstall-token/reveal" pick={(d) => (d as { uninstall_token: string }).uninstall_token}
        intro="The uninstaller asks for it. It is the same for every computer in your company."
        outro="Keep it private. Anyone with it and administrator rights can remove WorkBeat." />
      <div className="stack"><h3>Windows</h3><p className="small">From a command prompt opened as administrator:</p>
        <div className="code">msiexec /x {'{ProductCode}'} UNINSTALL_TOKEN=&lt;token&gt; /qn /norestart</div>
        <p className="small muted">Mac: the uninstall command is not published yet.</p></div>
    </div>
  );
}

function MinVersion() {
  const v = useData<Record<'macos' | 'windows', string[]>>('/v1/agent-versions');
  const [pick, setPick] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null | undefined>(undefined);
  const lic = useData<{ min_agent_version: string | null }>('/v1/license');
  const current = saved !== undefined ? saved : lic.data?.min_agent_version;
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (pick === null) return;
    setBusy(true); setNote(null);
    const r = await call<{ min_agent_version: string | null }>('PUT', '/v1/deployment/min-agent-version', { min_agent_version: pick || null });
    setBusy(false);
    if (r.ok) { setSaved(r.data.min_agent_version); setPick(null); return setNote({ ok: true, text: 'Minimum version saved.' }); }
    setNote({ ok: false, text: r.status === 422 ? 'That version is above the newest release. Pick one from the list.' : message(r.status, r.err.code) });
  }

  return (
    <form className="card stack" onSubmit={save}>
      <div><h2>Minimum agent version</h2>
        <p className="small muted">Computers below this version show as {label('badge', 'outdated')} on Devices and update themselves.</p></div>
      <Loaded s={v} rows={1}>{(vs) => !vs.macos.length && !vs.windows.length ? <p className="small muted">No agent versions are released yet.</p> : (
        <div className="row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ maxWidth: 280 }}>
            <label htmlFor="minver">Minimum version</label>
            <select id="minver" value={pick ?? '__'} onChange={(e) => setPick(e.target.value)}>
              <option value="__" disabled>Choose a version</option>
              <option value="">No minimum</option>
              {(['windows', 'macos'] as const).map((os) => vs[os].length > 0 && (
                <optgroup key={os} label={label('os', os)}>{vs[os].map((x) => <option key={x} value={x}>{x}</option>)}</optgroup>
              ))}
            </select>
          </div>
          <button className="btn pri" disabled={busy || pick === null}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      )}</Loaded>
      {current !== undefined && <p className="small">Now: {current ?? 'no minimum'}</p>}
      {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
    </form>
  );
}
