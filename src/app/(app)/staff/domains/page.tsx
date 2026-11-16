'use client';
import { label } from '@/lib/labels';
import { Loaded, PageHead, useData } from '@/lib/use-data';
import { when } from '@/lib/time';
import { useList } from '@/components/list';
import { Boundary, type Companies } from '@/components/staff/common';

const PILL = { pending: 'p-warn', active: 'p-ok', failed: 'p-bad' } as const;

export default function StaffDomains() {
  const s = useData<Companies>('/v1/staff/companies');
  const rows = (s.data?.items ?? []).filter((c) => c.custom_domain);
  const L = useList(rows, (c) => `${c.custom_domain} ${c.name}`);

  return (
    <>
      <PageHead title="Custom domains" sub="Domains customers have added. Certificates are issued once the DNS checks pass." />
      <Boundary />
      <div className="card stack">
        <div className="toolbar">{L.search('Search domains or companies')}</div>
        <Loaded s={s}>{() => (
          <>
            <div className="tablewrap">
              <table>
                <thead><tr><th>Domain</th><th>Company</th><th>Status</th><th>Last check (UTC)</th></tr></thead>
                <tbody>
                  {!L.rows.length ? <tr><td colSpan={4} className="muted">{rows.length ? 'No domain matches.' : 'No company has a custom domain yet.'}</td></tr>
                    : L.rows.map((c) => (
                      <tr key={c.id}>
                        <td className="mono">{c.custom_domain}</td>
                        <td>{c.name}</td>
                        <td><span className={`pill ${c.custom_domain_status ? PILL[c.custom_domain_status] : ''}`}>{label('domainStatus', c.custom_domain_status)}</span></td>
                        <td className="small">{c.custom_domain_checked_at ? when(c.custom_domain_checked_at, 'UTC') : 'Not checked yet'}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {L.pager}
          </>
        )}</Loaded>
        <p className="small muted">DNS checks run every 5 minutes. Only the company&apos;s admin can add, change or remove its domain; a domain that is not verified needs the company admin to fix its DNS records.</p>
      </div>
    </>
  );
}
