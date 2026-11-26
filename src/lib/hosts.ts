// WorkBeat's own addresses: never looked up as custom domains (custom-domain "Only approved addresses open the console").
// {slug}.tryworkbeat.com, Vercel preview URLs and local development, plus any listed in APP_HOSTS (comma-separated).
const OWN = ['localhost', '127.0.0.1', 'tryworkbeat.com'];
const OWN_SUFFIXES = ['.tryworkbeat.com', '.vercel.app'];

/** `host` without its port, lower case. */
export const bareHost = (host: string | null) => (host ?? '').split(':')[0].toLowerCase();

export function isOwnHost(host: string, extra = process.env.APP_HOSTS ?? '') {
  const listed = extra.split(',').map((h) => h.trim().toLowerCase()).filter(Boolean);
  return !host || OWN.includes(host) || listed.includes(host) || OWN_SUFFIXES.some((s) => host.endsWith(s));
}
