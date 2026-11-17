import { notFound } from 'next/navigation';

import { ThrowButton } from './throw-button';

export const metadata = { title: 'Sentry check', robots: { index: false } };

/** Preview-only page for the BRAIN-6 acceptance check: throw on purpose and find it in Sentry. */
export default function SentryCheckPage() {
  if (process.env.VERCEL_ENV === 'production') notFound();
  return (
    <main className="mx-auto max-w-md p-10">
      <h1 className="font-display text-2xl font-bold">Sentry check</h1>
      <p className="mt-2 text-muted-foreground">
        Throws an error in the browser. It should appear in Sentry tagged with this deployment&apos;s commit.
      </p>
      <ThrowButton />
    </main>
  );
}
