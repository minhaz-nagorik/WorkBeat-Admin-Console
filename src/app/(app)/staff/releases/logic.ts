// Pure release rules for the Agent releases page (agent-releases spec). Tested in logic.test.ts.
export type Release = {
  id: string; product: 'agent' | 'downloader'; platform: 'macos' | 'windows'; arch: 'universal' | 'x64' | 'arm64';
  version: string; min_supported: string; sha256: string; signature: string | null; size_bytes: number;
  release_notes: string | null; released_at: string; withdrawn_at: string | null;
};

export const VERSION = /^\d+\.\d+\.\d+$/;

/** Compare `x.y.z` strings numerically. */
export function cmp(a: string, b: string): number {
  const x = a.split('.').map(Number), y = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) if ((x[i] || 0) !== (y[i] || 0)) return (x[i] || 0) - (y[i] || 0);
  return 0;
}

/** Global minimum per platform: greatest `min_supported` among live agent releases at that platform's highest version. */
export function minimum(rs: Release[], platform: Release['platform']): string | null {
  const live = rs.filter((r) => r.product === 'agent' && r.platform === platform && !r.withdrawn_at);
  if (!live.length) return null;
  const top = live.reduce((m, r) => (cmp(r.version, m) > 0 ? r.version : m), live[0].version);
  return live.filter((r) => r.version === top).reduce((m, r) => (cmp(r.min_supported, m) > 0 ? r.min_supported : m), '0.0.0');
}

/** Current = newest live release of its product, platform and architecture; Withdrawn; else Supported. */
export function state(r: Release, rs: Release[]): 'Current' | 'Supported' | 'Withdrawn' {
  if (r.withdrawn_at) return 'Withdrawn';
  const newer = rs.some((o) => !o.withdrawn_at && o.product === r.product && o.platform === r.platform && o.arch === r.arch && cmp(o.version, r.version) > 0);
  return newer ? 'Supported' : 'Current';
}

/** Field errors of the publish form, before anything is sent. */
export function check(f: { platform: string; arch: string; version: string; min_supported: string; signature: string; file: unknown }) {
  const e: Record<string, string> = {};
  if (!VERSION.test(f.version)) e.version = 'Use the form 1.2.3.';
  if (!VERSION.test(f.min_supported)) e.min_supported = 'Use the form 1.2.3.';
  else if (VERSION.test(f.version) && cmp(f.min_supported, f.version) > 0) e.min_supported = "The minimum can't be above the version.";
  if (f.platform === 'macos' && f.arch !== 'universal') e.arch = 'macOS releases are Universal.';
  if (f.platform === 'windows' && !['x64', 'arm64'].includes(f.arch)) e.arch = 'Pick x64 or ARM64.';
  if (f.platform === 'macos' && !f.signature.trim()) e.signature = 'macOS releases need a signature.';
  if (!f.file) e.file = 'Choose the installer file.';
  return e;
}
