import { headers } from 'next/headers';
import { api } from '@/lib/api-server';
import { SignIn } from './sign-in';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const q = await searchParams;
  const host = ((await headers()).get('host') ?? '').split(':')[0];
  // The host only names the company on the page; the account decides where the user goes.
  const co = await api<{ name: string }>(`/v1/hosts/resolve?host=${encodeURIComponent(host)}`).catch(() => null);
  const next = q.next?.startsWith('/') && !q.next.startsWith('//') ? q.next : null;
  return <SignIn company={co?.data?.name ?? null} next={next} expired={q.expired === '1'} />;
}
