'use client';
// A Company Admin edits only the time zone and the idle threshold here (B29). Company name, data retention,
// custom domain, the monitoring notice and billing are managed by WorkBeat staff; the API refuses them (403).
// The screenshot interval is set on each employee, never faster than the plan (D37, B11).
import { isPending, SENT } from '@/components/pending';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { call, message } from '@/lib/client';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { useMe } from '@/lib/me';
import { Combo, Field } from '@/components/form';

type Settings = { idle_threshold_seconds: number; timezone: string };

export default function CompanySettings() {
  const me = useMe();
  const settings = useData<Settings>('/v1/company/settings');
  return (
    <>
      <PageHead title="Company settings" sub={me.company?.name} />
      <div className="grid g2">
        <Loaded s={settings} rows={3}>{(s) => <CompanyForm s={s} onSaved={(d) => settings.set(() => d)} />}</Loaded>
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
