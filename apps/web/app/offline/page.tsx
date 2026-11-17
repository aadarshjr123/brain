import type { Metadata } from 'next';
import Link from 'next/link';

import { SiteHeader } from '@/components/site/site-header';

export const metadata: Metadata = { title: 'Offline', robots: { index: false } };

/** Shown when a page was never visited and the network is down. */
export default function OfflinePage() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-xl px-4 py-20 text-center sm:px-6">
        <h1 className="font-display text-3xl font-bold">You are offline</h1>
        <p className="mt-3 text-muted-foreground">
          This page was not saved on this device yet. The map, the cheatsheet and every concept page you have
          opened before still work.
        </p>
        <p className="mt-6 flex justify-center gap-3">
          <Link
            href="/explore"
            className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Open the map
          </Link>
          <Link href="/cheatsheet" className="rounded-lg border border-border px-4 py-2 font-medium">
            Cheatsheet
          </Link>
        </p>
      </main>
    </>
  );
}
