import { sentryDsn, sentryEnvironment, sentryRelease } from '@/lib/observability/sentry';

if (sentryDsn) {
  void import('@sentry/nextjs').then((Sentry) => {
    Sentry.init({
      dsn: sentryDsn,
      release: sentryRelease,
      environment: sentryEnvironment,
      // Errors only. Performance comes from Speed Insights. No replay; Sentry 11 sends no PII by default.
      tracesSampleRate: 0,
    });
  });
}
