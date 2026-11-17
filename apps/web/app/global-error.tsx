'use client';

import { useEffect } from 'react';

import { captureException } from '@/lib/observability/sentry';

import './globals.css';

/** Last-resort boundary: replaces the root layout when it throws, so it renders its own html and body. */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    void captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body className="grid min-h-dvh place-items-center bg-background p-6 text-foreground">
        <main className="max-w-md text-center">
          <h1 className="font-display text-2xl font-bold">Something broke.</h1>
          <p className="mt-2 text-muted-foreground">
            The error was reported. Try again, and if it keeps happening the map still works from the
            cheatsheet.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
