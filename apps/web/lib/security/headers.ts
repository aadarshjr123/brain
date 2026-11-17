/**
 * Security headers for every response (BRAIN-31, ADR-0011).
 *
 * script-src allows inline scripts: statically rendered App Router pages carry inline RSC payload scripts that
 * differ per page, so they can be neither nonced (that needs per-request rendering) nor hashed in a static header.
 * Everything else is locked down, and Trusted Types closes the DOM sinks an inline-script injection would need.
 */
export interface SecurityOptions {
  /** Development needs eval for React's debugging and Fast Refresh. */
  dev: boolean;
  /** Origin of the Sentry ingest endpoint, when a DSN is configured. */
  sentryOrigin?: string | undefined;
}

export function contentSecurityPolicy({ dev, sentryOrigin }: SecurityOptions): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", ...(dev ? ["'unsafe-eval'"] : [])],
    // React style props and next/font's inline @font-face need inline styles; styles cannot run code.
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'blob:'],
    'font-src': ["'self'"],
    'connect-src': ["'self'", ...(sentryOrigin ? [sentryOrigin] : []), ...(dev ? ['ws:'] : [])],
    'worker-src': ["'self'"],
    'manifest-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };
  if (!dev) directives['require-trusted-types-for'] = ["'script'"];
  return Object.entries(directives)
    .map(([k, v]) => [k, ...v].join(' '))
    .join('; ');
}

export function securityHeaders(options: SecurityOptions): { key: string; value: string }[] {
  return [
    { key: 'Content-Security-Policy', value: contentSecurityPolicy(options) },
    { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
    { key: 'X-Content-Type-Options', value: 'nosniff' },
    { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
    { key: 'X-Frame-Options', value: 'DENY' },
    { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
    {
      key: 'Permissions-Policy',
      value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), browsing-topics=()',
    },
  ];
}

/** "https://o1.ingest.sentry.io/123" → "https://o1.ingest.sentry.io"; undefined for no or bad DSN. */
export function sentryOriginFromDsn(dsn: string | undefined): string | undefined {
  if (!dsn) return undefined;
  try {
    return new URL(dsn).origin;
  } catch {
    return undefined;
  }
}
