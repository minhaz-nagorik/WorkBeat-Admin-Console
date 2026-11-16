import { NAV } from '@/lib/nav';

// shortcut: every page not built yet lands here; each change in docs/BUILD-ORDER.md replaces its route.
export default async function NotBuilt({ params }: { params: Promise<{ slug: string[] }> }) {
  const path = '/' + (await params).slug.join('/');
  const item = NAV.flatMap((g) => g.items).find((i) => path === i.href || path.startsWith(i.href + '/'));
  return (
    <div className="pagehead">
      <div><h1>{item?.label ?? 'Page'}</h1><p>This page is not built yet.</p></div>
    </div>
  );
}
