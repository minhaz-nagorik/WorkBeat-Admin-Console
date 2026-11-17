import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { api } from '@/lib/api-server';
import { allowed, landing, navFor } from '@/lib/nav';
import type { Me, StatusInfo } from '@/lib/types';
import { Shell } from '@/components/shell';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const path = (await headers()).get('x-pathname') ?? '/';
  const me = await api<Me>('/v1/me');
  if (me.status === 401) redirect(`/sign-in?expired=1&next=${encodeURIComponent(path)}`);
  if (!me.data) return ( // API down, restarting or failing: say so instead of crashing the page
    <div className="authwrap">
      <div className="card authcard">
        <h1>WorkBeat can&apos;t be reached</h1>
        <p className="muted">Your account couldn&apos;t be loaded. The service may be restarting. Try again in a moment.</p>
        <a className="btn pri" href={path}>Try again</a>
      </div>
    </div>
  );
  const user = me.data;
  if (user.must_change_password && path !== '/account') redirect('/account'); // temporary password: change it first
  if (!allowed(user.role, path)) redirect(landing(user.role));

  const status = user.company ? (await api<StatusInfo>('/v1/company/status')).data : null;
  return (
    <Shell me={user} nav={navFor(user.role)} status={status}>
      {children}
    </Shell>
  );
}
