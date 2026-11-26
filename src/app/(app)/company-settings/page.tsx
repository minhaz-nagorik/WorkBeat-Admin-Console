'use client';
// A Company Admin edits the time zone, the idle threshold and the custom domain here (B29, B33). Company name,
// data retention, the monitoring notice and billing are managed by WorkBeat staff; the API refuses them (403).
// A custom domain works only after WorkBeat approves it (A17).
// The screenshot interval is set on each employee, never faster than the plan (D37, B11).
import { isPending, SENT } from '@/components/pending';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { label } from '@/lib/labels';
import { Combo, Field } from '@/components/form';
import { ConfirmButton } from '@/components/confirm';

type Settings = { idle_threshold_seconds: number; timezone: string; slack_webhook_set: boolean };

export default function CompanySettings() {
  const me = useMe();
  const settings = useData<Settings>('/v1/company/settings');
  return (
    <>
      <PageHead title="Company settings" sub={me.company?.name} />
      <div className="grid g2">
        <Loaded s={settings} rows={3}>{(s) => <CompanyForm s={s} onSaved={(d) => settings.set(() => d)} />}</Loaded>
        <DomainCard />
        <Loaded s={settings} rows={2}>{(s) => <SlackCard set={s.slack_webhook_set} onSaved={(d) => settings.set(() => d)} />}</Loaded>
      </div>
    </>
  );
}

const FIELD_ERR: Record<string, string> = {
  timezone: 'Pick a time zone from the list.',
  idle_threshold_seconds: 'Use a whole number of minutes from 1 to 60.',
};
const whole = (v: string, min: number, max: number) => /^\d+$/.test(v) && +v >= min && +v <= max;

function CompanyForm({ s, onSaved }: { s: Settings; onSaved: (d: Settings) => void }) {
  const router = useRouter();
  const zones = useMemo(() => { try { return [...new Set(['UTC', ...Intl.supportedValuesOf('timeZone')])]; } catch { return ['UTC']; } }, []);
  const [zone, setZone] = useState(s.timezone);
  const [idle, setIdle] = useState(String(Math.round(s.idle_threshold_seconds / 60)));
  const [err, setErr] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (!zones.includes(zone)) v.timezone = FIELD_ERR.timezone;
    if (!whole(idle, 1, 60)) v.idle_threshold_seconds = FIELD_ERR.idle_threshold_seconds;
    setErr(v); setSaved(false);
    if (Object.keys(v).length) return;
    setBusy(true);
    const r = await call<Settings>('PATCH', '/v1/company/settings', { timezone: zone, idle_threshold_seconds: +idle * 60 });
    setBusy(false);
    if (isPending(r)) return setErr({ form: SENT });
    if (r.ok) { onSaved(r.data); setSaved(true); router.refresh(); return; } // refresh reloads GET /v1/me in the shell
    if (r.status === 422 && r.err.fields?.some((f) => FIELD_ERR[f])) {
      return setErr(Object.fromEntries(r.err.fields.filter((f) => FIELD_ERR[f]).map((f) => [f, FIELD_ERR[f]])));
    }
    setErr({ form: r.status === 422 ? 'Check the values above and try again.' : message(r.status, r.err.code) });
  }

  return (
    <form method="post" className="card stack" onSubmit={submit} noValidate>
      <h2>Company</h2>
      <Combo id="co-tz" label="Time zone" options={zones} value={zone} error={err.timezone} onChange={setZone}
        hint="Days, weeks and times across the dashboard follow this zone. Pick from the list or type to search." />
      <Field id="co-idle" label="Idle after (minutes)" type="number" inputMode="numeric" min={1} max={60} step={1} style={{ maxWidth: 120 }}
        value={idle} error={err.idle_threshold_seconds} onChange={(e) => setIdle(e.target.value)}
        hint="A computer with no keyboard or mouse use for this long counts as idle. Computers pick up a change within 30 minutes. 1 to 60." />
      <p className="small muted">Screenshot intervals are set on each employee, never more often than your plan allows. For other company details, contact WorkBeat.</p>
      {err.form && <div className="err" role="alert">{err.form}</div>}
      <div className="row">
        <button className="btn pri" disabled={busy}>{busy ? 'Saving…' : 'Save'}</button>
        {saved && <span className="small muted" role="status">Saved.</span>}
      </div>
    </form>
  );
}

// GET /v1/company/custom-domain (custom-domains). null when none is set.
type Domain = { domain: string; status: 'pending' | 'active' | 'failed'; cname_target: string; txt_name: string; txt_value: string; verified_at: string | null } | null;
const DOMAIN_PILL = { pending: 'p-warn', active: 'p-ok', failed: 'p-bad' } as const;

function DomainCard() {
  const d = useData<Domain>('/v1/company/custom-domain');
  const [value, setValue] = useState('');
  const [err, setErr] = useState<{ domain?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim()) return setErr({ domain: 'Enter a domain such as monitor.yourcompany.com.' });
    setBusy(true); setErr({});
    const r = await call<Domain>('PUT', '/v1/company/custom-domain', { domain: value.trim() });
    setBusy(false);
    if (r.ok) { setValue(''); return d.set(() => r.data); }
    if (r.status === 422) return setErr({ domain: 'Enter a domain you own, such as monitor.yourcompany.com. A workbeat.io address cannot be used.' });
    if (r.status === 409) return setErr({ domain: 'Another company already uses this domain.' });
    setErr({ form: message(r.status, r.err.code) });
  }
  async function remove() {
    const r = await call('DELETE', '/v1/company/custom-domain');
    if (r.ok) return d.set(() => null);
    setErr({ form: message(r.status, r.err.code) });
  }

  // Loaded shows a skeleton for null data, and null here means "no domain": use it only while loading or failed.
  if (d.loading || d.status) return <Loaded s={d} rows={2}>{() => null}</Loaded>;
  const dom = d.data;
  return (
    <div className="card stack">
      <h2>Custom domain</h2>
      {dom && (
        <div className="stack">
          <div className="row">
            <span className="mono">{dom.domain}</span>
            <span className={`pill ${DOMAIN_PILL[dom.status]}`}>{label('domainStatus', dom.status)}</span>
          </div>
          {dom.status !== 'active' && (
            <>
              <p className="small">Add these two records where your domain is managed. WorkBeat checks them and then turns the domain on.</p>
              <div className="tablewrap">
                <table>
                  <thead><tr><th>Type</th><th>Name</th><th>Value</th></tr></thead>
                  <tbody>
                    <tr><td>CNAME</td><td className="mono">{dom.domain}</td><td className="mono">{dom.cname_target}</td></tr>
                    <tr><td>TXT</td><td className="mono">{dom.txt_name}</td><td className="mono">{dom.txt_value}</td></tr>
                  </tbody>
                </table>
              </div>
            </>
          )}
          {dom.status === 'failed' && <p className="small">WorkBeat could not approve this domain. Check the records above, then contact WorkBeat.</p>}
          <div className="row">
            <ConfirmButton label="Remove domain" action="Remove"
              question={`Remove ${dom.domain}? The dashboard stops opening at this address. You can add a domain again later.`} onConfirm={remove} />
          </div>
        </div>
      )}
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <Field id="co-domain" label={dom ? 'Use a different domain' : 'Domain'} value={value} error={err.domain} maxLength={253}
          placeholder="monitor.yourcompany.com" onChange={(e) => setValue(e.target.value)}
          hint={dom ? 'A new domain replaces the current one and needs WorkBeat approval again.' : 'Your team can open the dashboard at this address once WorkBeat approves it.'} />
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="row"><button className="btn pri" disabled={busy}>{busy ? 'Saving…' : dom ? 'Change domain' : 'Add domain'}</button></div>
      </form>
    </div>
  );
}

// Tamper alerts also go to a Slack channel through its incoming-webhook URL (slack-alerts). The API never returns the URL.
const SLACK_HINT = 'In Slack, add the Incoming Webhooks app to the channel and paste the URL it gives you. It starts with https://hooks.slack.com/services/.';

function SlackCard({ set, onSaved }: { set: boolean; onSaved: (d: Settings) => void }) {
  const [value, setValue] = useState('');
  const [err, setErr] = useState<{ url?: string; form?: string }>({});
  const [busy, setBusy] = useState(false);

  async function save(url: string | null) {
    setBusy(true); setErr({});
    const r = await call<Settings>('PATCH', '/v1/company/settings', { slack_webhook_url: url });
    setBusy(false);
    if (isPending(r)) return setErr({ form: SENT });
    if (r.ok) { setValue(''); return onSaved(r.data); }
    setErr(r.status === 422 ? { url: SLACK_HINT } : { form: message(r.status, r.err.code) });
  }
  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!value.trim().startsWith('https://hooks.slack.com/services/')) return setErr({ url: SLACK_HINT });
    void save(value.trim());
  }

  return (
    <div className="card stack">
      <h2>Slack alerts</h2>
      <p className="small">Alerts are posted to a Slack channel as well as emailed, for the same alert types and at the same times.</p>
      {set && (
        <div className="row">
          <span className="pill p-ok">Connected</span>
          <ConfirmButton label="Disconnect" action="Disconnect"
            question="Disconnect Slack? Alerts stop going to the channel. Emails are not affected." onConfirm={() => save(null)} />
        </div>
      )}
      <form method="post" className="stack" onSubmit={submit} noValidate>
        <Field id="co-slack" label={set ? 'Use a different webhook URL' : 'Webhook URL'} value={value} error={err.url} maxLength={500}
          type="password" autoComplete="off" placeholder="https://hooks.slack.com/services/…" onChange={(e) => setValue(e.target.value)} hint={SLACK_HINT} />
        {err.form && <div className="err" role="alert">{err.form}</div>}
        <div className="row"><button className="btn pri" disabled={busy}>{busy ? 'Saving…' : set ? 'Change' : 'Connect'}</button></div>
      </form>
    </div>
  );
}
