// Every date and time in the company's zone, never the browser's (A9, rule 7).

/** YYYY-MM-DD of `d` in `tz`. */
export function dayKey(d: Date, tz: string): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
}

const hhmm = (d: Date, tz: string) =>
  new Intl.DateTimeFormat('en-GB', { timeZone: tz, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(d);

/** "09:42 today", "Yesterday 16:03", or "3 Nov 2026, 10:15". */
export function when(iso: string, tz: string, now = new Date()): string {
  const d = new Date(iso);
  const k = dayKey(d, tz);
  if (k === dayKey(now, tz)) return `${hhmm(d, tz)} today`;
  if (k === dayKey(new Date(now.getTime() - 864e5), tz)) return `Yesterday ${hhmm(d, tz)}`;
  return `${dateOnly(iso, tz)}, ${hhmm(d, tz)}`;
}

/** "15 December 2026". */
export function dateOnly(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso));
}

/** Full date, time and zone for a tooltip. */
export function full(iso: string, tz: string): string {
  return new Intl.DateTimeFormat('en-GB', { timeZone: tz, dateStyle: 'full', timeStyle: 'short' }).format(new Date(iso)) + ` (${tz})`;
}

/** Start of the company's current day as an ISO instant. */
export function startOfToday(tz: string, now = new Date()): string {
  // Offset of tz at `now`, from the difference between the zone's wall clock and UTC.
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit',
  }).formatToParts(now).map((x) => [x.type, x.value]));
  const wall = Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second);
  const offset = wall - Math.floor(now.getTime() / 1000) * 1000;
  return new Date(Date.UTC(+p.year, +p.month - 1, +p.day) - offset).toISOString();
}
