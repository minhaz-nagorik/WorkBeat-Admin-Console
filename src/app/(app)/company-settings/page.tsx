'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, Skeleton, useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { label, options } from '@/lib/labels';
import { dateOnly, when } from '@/lib/time';
import { Confirm, ConfirmButton, Modal } from '@/components/confirm';
import { Field } from '@/components/form';
import { NoticeEditor } from '@/components/policies/notice-editor';

type Settings = { name: string; slug: string; data_retention_days: number; idle_threshold_seconds: number; timezone: string };
type Domain = { domain: string; status: 'pending' | 'active' | 'failed'; cname_target: string; txt_name: string; txt_value: string; checked_at: string | null };
type Tier = 'off' | 'light' | 'standard' | 'intensive';
type Billing = {
  plan: string; seat_limit: number | null; seats_used: number; screenshot_tier: Tier;
  scheduled_screenshot_tier: Tier | null; scheduled_at: string | null; trial_ends_at: string | null; current_period_end: string | null;
};

export default function CompanySettings() {
  const me = useMe();
  const settings = useData<Settings>('/v1/company/settings');
  return (
    <>
      <PageHead title="Company settings" sub={me.company?.name} />
      <div className="grid g2">
        <Loaded s={settings} rows={6}>{(s) => <CompanyForm s={s} onSaved={(d) => settings.set(() => d)} />}</Loaded>
        <DomainCard slug={me.company?.slug ?? ''} />
      </div>
      {/* Alert emails are edited on the Alerts page (handle-alerts). The notice sits here as in the prototype. */}
      {settings.data && <NoticeEditor retentionDays={settings.data.data_retention_days} />}
      <BillingCard />
    </>
  );
}

// ---------- Company form ----------

const RETENTION_PICKS = [30, 60, 90, 180, 365];
const FIELD_ERR: Record<string, string> = {
  name: 'Use 1 to 100 characters.',
  timezone: 'Pick a time zone from the list.',
  idle_threshold_seconds: 'Use a whole number of minutes from 1 to 60.',
  data_retention_days: 'Use a whole number of days from 1 to 365.',
};
const whole = (v: string, min: number, max: number) => /^\d+$/.test(v) && +v >= min && +v <= max;

function CompanyForm({ s, onSaved }: { s: Settings; onSaved: (d: Settings) => void }) {
  const router = useRouter();
  const { tz } = useMe();
  const zones = useMemo(() => { try { return [...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])]; } catch { return ['UTC']; } }, []);
  const [name, setName] = useState(s.name);
  const [zone, setZone] = useState(s.timezone);
  const [idle, setIdle] = useState(String(Math.round(s.idle_threshold_seconds / 60)));
  const [days, setDays] = useState(String(s.data_retention_days));
  const [err, setErr] = useState<Record<string, string>>({});
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  function check() {
    const e: Record<string, string> = {};
    if (!name.trim() || name.trim().length > 100) e.name = FIELD_ERR.name;
    if (!zones.includes(zone)) e.timezone = FIELD_ERR.timezone;
    if (!whole(idle, 1, 60)) e.idle_threshold_seconds = FIELD_ERR.idle_threshold_seconds;
    if (!whole(days, 1, 365)) e.data_retention_days = FIELD_ERR.data_retention_days;
    setErr(e); setSaved(false);
    return !Object.keys(e).length;
  }

  async function save() {
    setConfirming(false); setBusy(true);
    const r = await call<Settings>('PATCH', '/v1/company/settings', {
      name: name.trim(), timezone: zone, idle_threshold_seconds: +idle * 60, data_retention_days: +days,
    });
    setBusy(false);
    if (r.ok) { onSaved(r.data); setSaved(true); router.refresh(); return; } // refresh reloads GET /v1/me in the shell
    if (r.status === 422 && r.err.fields?.some((f) => FIELD_ERR[f])) {
      return setErr(Object.fromEntries(r.err.fields.filter((f) => FIELD_ERR[f]).map((f) => [f, FIELD_ERR[f]])));
    }
    setErr({ form: r.status === 422 ? 'Check the values above and try again.' : message(r.status, r.err.code) });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!check()) return;
    if (+days < s.data_retention_days) return setConfirming(true);
    save();
  }

  const cutoff = dateOnly(new Date(Date.now() - +days * 864e5).toISOString(), tz);
  return (
    <form method="post" className="card stack" onSubmit={submit} noValidate>
      <h2>Company</h2>
      <Field id="co-name" label="Company name" required maxLength={100} value={name} error={err.name} onChange={(e) => setName(e.target.value)} />
      <div className="field">
        <span id="co-slug-label" style={{ fontWeight: 500 }}>Dashboard address</span>
        <div className="mono" aria-labelledby="co-slug-label">{s.slug}.workbeat.io</div>
        <span className="hint">The address keeps its original name when you rename the company.</span>
      </div>
      <Field id="co-tz" label="Time zone" list="co-tz-list" autoComplete="off" value={zone} error={err.timezone}
        hint="Days, weeks and times across the dashboard follow this zone. Type to search." onChange={(e) => setZone(e.target.value)} />
      <datalist id="co-tz-list">{zones.map((z) => <option key={z} value={z} />)}</datalist>
      <Field id="co-idle" label="Idle after (minutes)" type="number" inputMode="numeric" min={1} max={60} step={1} style={{ maxWidth: 120 }}
        value={idle} error={err.idle_threshold_seconds} onChange={(e) => setIdle(e.target.value)}
        hint="A computer with no keyboard or mouse use for this long counts as idle. Computers pick up a change within 30 minutes. 1 to 60." />
      <div className="stack" style={{ gap: 6 }}>
        <Field id="co-ret" label="Keep activity data for (days)" type="number" inputMode="numeric" min={1} max={365} step={1} style={{ maxWidth: 120 }}
          value={days} error={err.data_retention_days} onChange={(e) => setDays(e.target.value)}
          hint="Older activity and screenshots are deleted every night. 1 to 365." />
        <div className="row" style={{ gap: 6 }} role="group" aria-label="Quick picks for days kept">
          {RETENTION_PICKS.map((d) => (
            <button key={d} type="button" className="btn sm" aria-pressed={+days === d} onClick={() => setDays(String(d))}>
              {d} days{d === 90 ? ' (default)' : ''}
            </button>
          ))}
        </div>
      </div>
      {err.form && <div className="err" role="alert">{err.form}</div>}
      {confirming ? (
        <Confirm question={`Keep data for ${days} days? Activity and screenshots from before ${cutoff} are deleted tonight and can't be recovered.`}
          action="Save and delete older data" onConfirm={save} onCancel={() => setConfirming(false)} />
      ) : (
        <div className="row">
          <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
          {saved && <span className="small muted" role="status">Saved.</span>}
        </div>
      )}
    </form>
  );
}

// ---------- Custom domain ----------

function Copy({ text, what }: { text: string; what: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn sm" aria-label={`Copy ${what}`}
      onClick={() => navigator.clipboard.writeText(text).then(() => { setDone(true); setTimeout(() => setDone(false), 2000); }, () => {})}>
      {done ? 'Copied' : 'Copy'}
    </button>
  );
}

function Record({ type, name, value, what }: { type: string; name: string; value: string; what: string }) {
  return (
    <li><b>{what}</b>
      <div className="dnsrec">
        <span className="tag">{type}</span><span className="small muted">Name</span><span className="mono">{name}</span><Copy text={name} what={`${type} name`} />
        <span /><span className="small muted">Value</span><span className="mono">{value}</span><Copy text={value} what={`${type} value`} />
      </div>
    </li>
  );
}

function DomainCard({ slug }: { slug: string }) {
  const { tz } = useMe();
  const s = useData<Domain | null>('/v1/company/custom-domain');
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const home = `${slug}.workbeat.io`;

  async function remove() {
    const r = await call('DELETE', '/v1/company/custom-domain');
    if (r.ok) { s.set(() => null); return setNote(null); }
    setNote(message(r.status, r.err.code));
  }

  if (s.status) return <Loaded s={s}>{() => null}</Loaded>;
  if (s.loading) return <Skeleton rows={4} />; // data null is a real state here: no domain
  const d = s.data;
  return (
        <div className="card stack">
          {!d ? (
            <>
              <h2>Custom domain</h2>
              <p className="small">Open your dashboard at your own address, for example <span className="mono">monitor.yourcompany.com</span>, instead of <span className="mono">{home}</span>. This is optional: <span className="mono">{home}</span> keeps working either way.</p>
              <div className="row"><button className="btn pri" onClick={() => setEditing(true)}>Add custom domain</button></div>
            </>
          ) : (
            <>
              <div className="row between"><h2>Custom domain</h2>
                <span className={`pill ${d.status === 'active' ? 'p-ok' : d.status === 'failed' ? 'p-bad' : 'p-warn'}`}>{label('domainStatus', d.status)}</span>
              </div>
              <div className="row between"><span className="mono">{d.domain}</span>
                <div className="row">
                  <button className="btn sm" onClick={() => setEditing(true)}>Change</button>
                  <ConfirmButton label="Remove" question={`Remove ${d.domain}? The dashboard will open only at ${home}.`} onConfirm={remove} />
                </div>
              </div>
              {d.status === 'active' ? (
                <p className="small">Live: your dashboard opens at <span className="mono">https://{d.domain}</span>. <span className="mono">{home}</span> still works too.</p>
              ) : (
                <>
                  {d.status === 'failed' && <div className="notice warn">We couldn&apos;t find the records yet. Check they match exactly.</div>}
                  <p className="small">Ask whoever manages your domain (for example in GoDaddy or Cloudflare) to add these two records:</p>
                  <ol className="guide">
                    <Record type="CNAME" name={d.domain} value={d.cname_target} what="Points the address to WorkBeat" />
                    <Record type="TXT" name={d.txt_name} value={d.txt_value} what="Proves your company owns the domain" />
                  </ol>
                  <p className="small muted">We check every 5 minutes, and new records can take up to an hour to show up.</p>
                </>
              )}
              <span className="small muted">Last checked: {d.checked_at ? when(d.checked_at, tz) : 'not yet'}</span>
            </>
          )}
          {note && <div className="err" role="alert">{note}</div>}
          <DomainDialog open={editing} current={d?.domain} home={home} onClose={() => setEditing(false)} onSaved={(nd) => { s.set(() => nd); setEditing(false); }} />
        </div>
  );
}

function DomainDialog({ open, current, home, onClose, onSaved }: {
  open: boolean; current?: string; home: string; onClose: () => void; onSaved: (d: Domain) => void;
}) {
  const [domain, setDomain] = useState('');
  const [err, setErr] = useState<{ domain?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (open) { setDomain(current ?? ''); setErr({}); } }, [open, current]);

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr({});
    const r = await call<Domain>('PUT', '/v1/company/custom-domain', { domain: domain.trim().toLowerCase() });
    setBusy(false);
    if (r.ok) return onSaved(r.data);
    if (r.status === 409) return setErr({ domain: 'Another company already uses this address.' });
    if (r.status === 422 || r.status === 400) return setErr({ domain: 'Use an address on a domain your company owns, like monitor.yourcompany.com.' });
    setErr({ form: message(r.status, r.err.code) });
  }

  return (
    <Modal title={current ? 'Change custom domain' : 'Add custom domain'} open={open} onClose={onClose}>
      <form method="post" className="stack" onSubmit={submit}>
        <Field id="domain" label="Address" required autoFocus autoComplete="off" spellCheck={false} placeholder="monitor.yourcompany.com"
          value={domain} error={err.domain} onChange={(e) => setDomain(e.target.value)}
          hint="It needs a part in front of your main domain, like monitor.yourcompany.com." />
        {current && <div className="notice warn">You&apos;ll need to add new DNS records, and {current} stops working. {home} keeps working.</div>}
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="mf">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Billing ----------

const TIERS: Record<Tier, { add: number; every: number | null }> = {
  off: { add: 0, every: null }, light: { add: 0.5, every: 60 }, standard: { add: 1, every: 30 }, intensive: { add: 2, every: 10 },
};
const BASE = 1;
const usd = (n: number) => `$${n.toFixed(2)}`;

/** Next-invoice estimate: seats × (base + screenshot add-on), per D43. */
const estimate = (seats: number, tier: Tier) => seats * (BASE + TIERS[tier].add);

function BillingCard() {
  const me = useMe();
  const s = useData<Billing>('/v1/billing');
  const [picked, setPicked] = useState<Tier | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);
  const [opening, setOpening] = useState(false);

  async function schedule(tier: Tier) {
    setPicked(null);
    const r = await call<Billing>('PUT', '/v1/billing/screenshot-tier', { screenshot_tier: tier });
    if (r.ok) { s.set(() => r.data); return setNote({ ok: true, text: `${label('tier', tier)} is scheduled.` }); }
    setNote({ ok: false, text: r.status === 404 || r.status === 501 ? "Changing the screenshot plan isn't available yet. Contact WorkBeat to change it." : message(r.status, r.err.code) });
  }

  async function portal() {
    setOpening(true); setNote(null);
    const r = await call<{ url: string }>('POST', '/v1/billing/portal-session');
    setOpening(false);
    if (r.ok && r.data?.url) return location.assign(r.data.url); // never stored or logged (A6)
    setNote({ ok: false, text: r.status === 404 || r.status === 501 ? "Payment and invoices aren't available here yet. Contact WorkBeat for a copy of an invoice." : message(r.status, r.ok ? '' : r.err.code) });
  }

  return (
    <section id="billing" className="card stack" aria-labelledby="billing-h">
      <h2 id="billing-h">Billing</h2>
      <Loaded s={s} rows={5}>{(b) => {
        const end = b.current_period_end ? dateOnly(b.current_period_end, me.tz) : null;
        const add = TIERS[b.screenshot_tier].add;
        const trialDays = me.company?.status === 'trial' && b.trial_ends_at ? Math.max(0, Math.ceil((Date.parse(b.trial_ends_at) - Date.now()) / 864e5)) : null;
        const lower = (t: Tier) => TIERS[t].add < add;
        const slowNote = (t: Tier) => t === 'off'
          ? 'screenshots stop for every employee'
          : `employees set faster than every ${TIERS[t].every} minutes slow to every ${TIERS[t].every} minutes`;
        return (
          <>
            <p className="small">
              {label('plan', b.plan)} plan · {b.seats_used} of {b.seat_limit ?? 'unlimited'} seats used
              {end && ` · Current period ends ${end}`}
            </p>
            {trialDays !== null && <div className="notice info">Trial: {trialDays} {trialDays === 1 ? 'day' : 'days'} left, until {dateOnly(b.trial_ends_at!, me.tz)}.</div>}
            <div className="tablewrap"><table><tbody>
              <tr><td>Base plan</td><td className="num">{b.seats_used} × {usd(BASE)}</td><td className="num">{usd(b.seats_used * BASE)}</td></tr>
              <tr><td>Screenshots ({label('tier', b.screenshot_tier)})</td><td className="num">{b.seats_used} × {usd(add)}</td><td className="num">{usd(b.seats_used * add)}</td></tr>
              <tr><td><b>Estimated next invoice{end ? `, ${end}` : ''}</b></td><td /><td className="num"><b>{usd(estimate(b.seats_used, b.screenshot_tier))}</b></td></tr>
            </tbody></table></div>
            <p className="small muted">An estimate from today&apos;s seats. Your invoice from Stripe is the final amount.</p>

            <div className="stack" style={{ gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 14 }}>Screenshot plan</h3>
              {b.scheduled_screenshot_tier && (
                <div className="notice info" role="status">
                  {label('tier', b.scheduled_screenshot_tier)} from {b.scheduled_at ? dateOnly(b.scheduled_at, me.tz) : 'the end of this period'}.
                  {lower(b.scheduled_screenshot_tier) && ` On that date ${slowNote(b.scheduled_screenshot_tier)}.`}
                </div>
              )}
              <div className="tiers" role="group" aria-label="Screenshot plan">
                {(options('tier') as [Tier, string][]).map(([t, name]) => {
                  const now = t === b.screenshot_tier, next = t === b.scheduled_screenshot_tier;
                  return (
                    <button key={t} type="button" className={`tier${now ? ' on' : ''}`} aria-pressed={now}
                      disabled={now && !b.scheduled_screenshot_tier} onClick={() => setPicked(t)}>
                      <b>{name}</b>
                      <span className="pr">+{usd(TIERS[t].add)}</span>
                      <span className="small muted">{TIERS[t].every ? `As often as every ${TIERS[t].every} minutes` : 'No screenshots'} · per seat a month</span>
                      {now && <span className="small">Your plan now</span>}
                      {next && <span className="small">Scheduled</span>}
                    </button>
                  );
                })}
              </div>
              {picked && (
                <Confirm action={`Switch to ${label('tier', picked)}`} onConfirm={() => schedule(picked)} onCancel={() => setPicked(null)}
                  question={`Switch to ${label('tier', picked)} from ${end ?? 'the end of this period'}?${lower(picked) ? ` On that date ${slowNote(picked)}.` : ''}`} />
              )}
              <p className="small muted">Changes apply at the end of the billing period. Intervals are set on each employee.</p>
            </div>

            <div className="row">
              <button className="btn" disabled={opening} onClick={portal}>{opening ? 'Opening…' : 'Payment method and invoices'}</button>
              <span className="small muted">Card details and invoices are handled by Stripe.</span>
            </div>
            {note && <div className={`notice ${note.ok ? 'ok' : 'warn'}`} role="status">{note.text}</div>}
          </>
        );
      }}</Loaded>
    </section>
  );
}
