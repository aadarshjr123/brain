import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

import { securityHeaders, sentryOriginFromDsn } from './lib/security/headers';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Memoisation by the compiler instead of hand-written useMemo/useCallback (PLAN.md §2).
  reactCompiler: true,
  // Link hrefs are checked against real routes at build time.
  typedRoutes: true,
  poweredByHeader: false,
  headers() {
    return Promise.resolve([
      {
        source: '/:path*',
        headers: securityHeaders({
          dev: process.env.NODE_ENV === 'development',
          sentryOrigin: sentryOriginFromDsn(process.env.NEXT_PUBLIC_SENTRY_DSN),
        }),
      },
      {
        // The worker must never be cached by the browser's HTTP cache, or new deploys would not reach users.
        source: '/sw.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Service-Worker-Allowed', value: '/' },
        ],
      },
    ]);
  },
};

// Source maps are uploaded to Sentry only when a token is present (Vercel production and preview).
// Without it the config is untouched, so local and fork builds never call Sentry.
export default process.env.SENTRY_AUTH_TOKEN
  ? withSentryConfig(nextConfig, {
      ...(process.env.SENTRY_ORG ? { org: process.env.SENTRY_ORG } : {}),
      ...(process.env.SENTRY_PROJECT ? { project: process.env.SENTRY_PROJECT } : {}),
      authToken: process.env.SENTRY_AUTH_TOKEN,
      silent: true,
      sourcemaps: { deleteSourcemapsAfterUpload: true },
      telemetry: false,
    })
  : nextConfig;
