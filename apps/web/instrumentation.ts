import type { Instrumentation } from 'next';

import { sentryDsn, sentryEnvironment, sentryRelease } from '@/lib/observability/sentry';

export async function register(): Promise<void> {
  if (!sentryDsn) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.init({
    dsn: sentryDsn,
    release: sentryRelease,
    environment: sentryEnvironment,
    tracesSampleRate: 0,
  });
}

export const onRequestError: Instrumentation.onRequestError = async (...args) => {
  if (!sentryDsn) return;
  const Sentry = await import('@sentry/nextjs');
  Sentry.captureRequestError(...args);
};
