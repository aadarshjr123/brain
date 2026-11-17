# ADR-0011: Content Security Policy for statically rendered pages

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-17      |
| Deciders | Aadarsh, Claude |

## Context

BRAIN-31's acceptance criteria asked for a CSP with no `'unsafe-inline'` scripts. Every page of Brain is statically
rendered (ADR-0002), and App Router pages embed **inline** scripts that carry the React Server Components payload
(`self.__next_f.push(...)`). Their content differs per page.

We tried the three standard ways to allow them without `'unsafe-inline'`:

| Approach                      | Result                                                                                                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nonces (Next's proxy pattern) | Requires dynamic rendering of every page: no static output, no CDN caching. Next's own docs say so.                                                            |
| `experimental.sri`            | Tested: adds `integrity` to external scripts only. The inline payload scripts were blocked; no hydration.                                                      |
| Per-page hashes               | The header is fixed before pages are rendered. A two-pass build could work, but any nondeterminism between passes blocks every script and takes the site down. |

## Decision

`script-src 'self' 'unsafe-inline'`, with everything around it locked down:

- No external script origins at all, no `'unsafe-eval'`, `object-src 'none'`, `base-uri 'self'`,
  `form-action 'self'`, `frame-ancestors 'none'`, `upgrade-insecure-requests`.
- **Trusted Types** (`require-trusted-types-for 'script'`), with a default policy installed first in `<head>` that
  allows only our own hashed chunks (`/_next/static/`) and `/sw.js` as script URLs. DOM-based injection, the realistic
  way to get script into a page with no server-rendered user input, throws instead of running.
- HSTS (two years, preload), `nosniff`, `strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, COOP,
  and a Permissions-Policy that turns off camera, microphone, geolocation, payment, USB and topics.
- `connect-src` adds the Sentry ingest origin only when a DSN is configured.

## Consequences

- Static pages and CDN caching stay. An injected inline `<script>` in server HTML would still run, but there is no
  path for one: content comes from the repo through React's escaping, and nothing user-supplied is rendered on the server.
- The e2e suite checks the headers on every page type and fails on any CSP or Trusted Types violation while using the app.
- Revisit when Next can emit hashes for inline scripts in static output, or if we ever render user input on the server.

## Alternatives considered

Listed in the table above. Dropping static rendering for a stricter header was rejected: it would trade a real
performance and cost benefit for protection against an injection path we do not have.
