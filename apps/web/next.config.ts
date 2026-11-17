import { withSentryConfig } from '@sentry/nextjs/config';
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Memoisation by the compiler instead of hand-written useMemo/useCallback (PLAN.md §2).
  reactCompiler: true,
  // Link hrefs are checked against real routes at build time.
  typedRoutes: true,
  poweredByHeader: false,
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
