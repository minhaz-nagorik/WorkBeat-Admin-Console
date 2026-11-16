// Icons copied from the prototype (static strings, no user input).
const IC: Record<string, string> = {
  overview: '<path d="M3 13h4l3-8 4 14 3-6h4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  employees: '<circle cx="9" cy="8" r="3.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M2.5 20c.8-3.6 3.4-5.5 6.5-5.5s5.7 1.9 6.5 5.5M16 4.8a3.3 3.3 0 0 1 0 6.4M18 14.6c1.9.6 3.2 2.2 3.6 5.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  devices: '<rect x="3" y="4" width="18" height="12" rx="1.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M1 20h22" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  deployment: '<path d="M12 3v12m0 0-4.5-4.5M12 15l4.5-4.5M4 17v3h16v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  alerts: '<path d="M12 3 2 20h20L12 3Zm0 6v5m0 3v.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
  blocklist: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="m5.6 5.6 12.8 12.8" stroke="currentColor" stroke-width="2"/>',
  productivity: '<path d="M4 20V10m6 10V4m6 16v-7m6 7H2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  team: '<circle cx="12" cy="8" r="4" fill="none" stroke="currentColor" stroke-width="2"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  company: '<path d="M4 21V5l8-3v19M12 9h8v12M7 8h2m-2 4h2m-2 4h2m6-3h2m-2 4h2M2 21h20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  device: '<rect x="6" y="2" width="12" height="20" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M11 18h2" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
  pricing: '<path d="M3 12V4h8l10 10-8 8L3 12Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7.5" cy="8.5" r="1.5" fill="currentColor"/>',
  admin: '<path d="M12 2 4 5v6c0 5 3.4 9.4 8 11 4.6-1.6 8-6 8-11V5l-8-3Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
};

export const Icon = ({ name }: { name: string }) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: IC[name] ?? IC.overview }} />
);

export const Logo = () => (
  <svg width="30" height="30" viewBox="0 0 32 32" aria-hidden="true">
    <rect width="32" height="32" rx="8" fill="var(--accent)" />
    <path d="M5 17h5l2.5-7 4 13 3-9 1.6 3H27" fill="none" stroke="var(--accent-fg)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
