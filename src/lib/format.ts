/** 5400 → "1h 30m", 300 → "5m". */
export function hm(seconds: number): string {
  const m = Math.round(seconds / 60), h = Math.floor(m / 60);
  return h ? `${h}h ${String(m % 60).padStart(2, '0')}m` : `${m}m`;
}

/** 0.423 → "42%". */
export const pct = (x: number) => `${Math.round(x * 100)}%`;

/** "Ada Lovelace" → "AL". */
export const initials = (n: string) => n.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join('').toUpperCase();
