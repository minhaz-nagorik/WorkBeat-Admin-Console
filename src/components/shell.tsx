'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { call, usePoll } from '@/lib/client';
import { dateOnly, startOfToday } from '@/lib/time';
import type { Me, StatusInfo } from '@/lib/types';
import type { navFor } from '@/lib/nav';
import { Logo, Icon } from './icons';
import { MeProvider } from '@/lib/me';

export function Shell({ me, nav, status, children }: {
  me: Me; nav: ReturnType<typeof navFor>; status: StatusInfo | null; children: React.ReactNode;
}) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [alerts, setAlerts] = useState(0);
  const [dark, setDark] = useState<boolean | null>(null); // known only in the browser
  useEffect(() => setDark(isDark()), []);
  const tz = me.company?.timezone ?? 'UTC';
  const seesAlerts = me.role !== 'super_admin';

  usePoll(() => {
    if (!seesAlerts) return;
    call<{ counts: Record<string, number> }>('GET', `/v1/alerts?state=open&from=${encodeURIComponent(startOfToday(tz))}`)
      .then((r) => { if (r.ok) setAlerts(Object.values(r.data.counts).reduce((a, b) => a + b, 0)); });
  });

  async function signOut() {
    await call('POST', '/v1/auth/logout');
    location.replace('/sign-in');
  }

  return (
    <div className={`shell ${open ? 'open' : ''}`}>
      <aside className="rail" id="rail" aria-label="Main navigation">
        <div className="brand">
          <Logo />
          <div><b>WorkBeat</b><span>{me.company ? me.company.name : 'Internal console'}</span></div>
        </div>
        {nav.map((g) => (
          <nav className="navgroup" key={g.group} aria-label={g.group}>
            <div className="label">{g.group}</div>
            {g.items.map((i) => {
              const on = path === i.href || path.startsWith(i.href + '/');
              return (
                <Link key={i.href} href={i.href} className={`nav ${on ? 'on' : ''}`} aria-current={on ? 'page' : undefined} onClick={() => setOpen(false)}>
                  <Icon name={i.icon} />{i.label}
                  {i.href === '/alerts' && alerts > 0 && <span className="cnt" title="Open alerts today" aria-label={`${alerts} open alerts today`}>{alerts}</span>}
                </Link>
              );
            })}
          </nav>
        ))}
        <div className="usermenu small">
          <div className="muted">Signed in as <b style={{ color: 'var(--fg)' }}>{me.name}</b><br />{me.email}</div>
          <div className="row" style={{ gap: 12 }}>
            <Link href="/account" onClick={() => setOpen(false)}>Change password</Link>
            <button className="linkbtn" onClick={signOut}>Sign out</button>
          </div>
        </div>
      </aside>
      <div className="scrim" onClick={() => setOpen(false)} />
      <div className="main">
        <header className="topbar">
          <button className="iconbtn menubtn" aria-label="Open menu" aria-expanded={open} aria-controls="rail" onClick={() => setOpen(true)}>☰ Menu</button>
          <div className="spacer" />
          {dark !== null && (
            <button className="iconbtn" onClick={() => setDark(toggleTheme())}>{dark ? '☀ Light' : '☾ Dark'}</button>
          )}
        </header>
        <main className="content">
          {status && <Banner s={status} tz={tz} isAdmin={me.role === 'company_admin'} />}
          <MeProvider value={me}>{children}</MeProvider>
        </main>
      </div>
    </div>
  );
}

function Banner({ s, tz, isAdmin }: { s: StatusInfo; tz: string; isAdmin: boolean }) {
  if (s.status === 'suspended') return (
    <div className="notice warn" role="status">
      <span><b>Company computers have stopped collecting activity.</b>{' '}
        {s.suspended_reason === 'payment_failed'
          ? <>Payment failed. {isAdmin ? <Link href="/company-settings#billing">Update your card in Billing</Link> : 'Ask your Company Admin to update the card in Billing'}.</>
          : 'Contact WorkBeat.'}</span>
    </div>
  );
  if (s.status === 'expired') return (
    <div className="notice warn" role="status">
      <span><b>Your subscription has ended.</b>{s.blocking_ends_at && <> Website blocking on company computers ends on {dateOnly(s.blocking_ends_at, tz)}.</>}</span>
    </div>
  );
  if (s.status === 'trial' && s.trial_ends_at) {
    const days = Math.max(0, Math.ceil((new Date(s.trial_ends_at).getTime() - Date.now()) / 864e5));
    return <div className="notice info" role="status"><span><b>Trial:</b> {days === 1 ? '1 day' : `${days} days`} left.</span></div>;
  }
  return null;
}

// Light or dark; with no choice saved the OS setting applies (CSS prefers-color-scheme).
function isDark() {
  const t = document.documentElement.dataset.theme;
  return t ? t === 'dark' : matchMedia('(prefers-color-scheme: dark)').matches;
}

/** Switch theme and return whether it is now dark. */
function toggleTheme() {
  const next = isDark() ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('wb-theme', next); } catch { /* storage blocked: choice lasts this page only */ }
  return next === 'dark';
}
