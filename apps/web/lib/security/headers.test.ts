import { describe, expect, it } from 'vitest';

import { contentSecurityPolicy, securityHeaders, sentryOriginFromDsn } from './headers';

describe('security headers', () => {
  const prod = contentSecurityPolicy({ dev: false });

  it('production CSP: no eval, no plugins, no framing, Trusted Types on', () => {
    expect(prod).not.toContain('unsafe-eval');
    expect(prod).toContain("object-src 'none'");
    expect(prod).toContain("frame-ancestors 'none'");
    expect(prod).toContain("base-uri 'self'");
    expect(prod).toContain("require-trusted-types-for 'script'");
    expect(prod).toMatch(/script-src 'self' 'unsafe-inline'(;|$)/); // ADR-0011: no third-party script origins
  });

  it('development allows eval and the HMR socket, and skips Trusted Types', () => {
    const dev = contentSecurityPolicy({ dev: true });
    expect(dev).toContain("'unsafe-eval'");
    expect(dev).toContain('ws:');
    expect(dev).not.toContain('require-trusted-types-for');
  });

  it('allows the Sentry ingest origin only when a DSN is configured', () => {
    expect(prod).not.toContain('sentry');
    const withSentry = contentSecurityPolicy({ dev: false, sentryOrigin: 'https://o1.ingest.sentry.io' });
    expect(withSentry).toContain("connect-src 'self' https://o1.ingest.sentry.io");
    expect(sentryOriginFromDsn('https://key@o1.ingest.sentry.io/42')).toBe('https://o1.ingest.sentry.io');
    expect(sentryOriginFromDsn('not a url')).toBeUndefined();
  });

  it('sends the transport, sniffing, referrer, framing and permissions headers', () => {
    const keys = securityHeaders({ dev: false }).map((h) => h.key);
    expect(keys).toEqual(
      expect.arrayContaining([
        'Content-Security-Policy',
        'Strict-Transport-Security',
        'X-Content-Type-Options',
        'Referrer-Policy',
        'X-Frame-Options',
        'Permissions-Policy',
        'Cross-Origin-Opener-Policy',
      ]),
    );
  });
});
