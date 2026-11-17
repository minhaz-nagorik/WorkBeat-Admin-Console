'use client';
import { PageHead } from '@/lib/use-data';
import { Install } from '@/components/downloads';

// IT Admin: installers and install steps only. The licence key comes from the Company Admin (A14).
export default function Downloads() {
  return (
    <>
      <PageHead title="Downloads" sub="Install WorkBeat on company computers. Ask your Company Admin for the licence key." />
      <Install itAdmin />
    </>
  );
}
