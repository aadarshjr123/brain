# ADR-0010: A small hand-written service worker instead of Serwist

|            |                                             |
| ---------- | ------------------------------------------- |
| Status     | Accepted                                    |
| Date       | 2026-11-17                                  |
| Deciders   | Aadarsh, Claude                             |
| Supersedes | "Serwist" in system design §3.7 and PLAN.md |

## Context

The system design planned Serwist for the offline shell. Serwist's Next.js integration (`@serwist/next`) is a webpack
plugin that injects a precache manifest at build. Next 16 builds with Turbopack by default, and we build with it.
Switching the build back to webpack for one feature would slow every build and diverge from the default toolchain.

What we need offline is small: after a first visit, the map, the cheatsheet and visited concept pages load without
a network, and a new deploy is never hidden behind a stale cache.

## Decision

Ship `public/sw.js`, about 80 lines, with three rules:

1. **Pages** (navigations): network first; on success, keep a copy; offline, serve the copy or `/offline`.
2. **Hashed build assets** (`/_next/static/*`): cache first. Their names change on every deploy, so they never go stale.
3. **Everything else same-origin** (images, icons, fonts): stale-while-revalidate.

A `VERSION` constant names the caches; activating a new version deletes the old ones. The runtime cache is trimmed to
a fixed number of entries so old deploys' assets do not pile up. The worker registers only in production builds.

## Consequences

- No build plugin, works with Turbopack, and every line is ours to read and test.
- No precache manifest: offline works for what a visitor has already loaded, plus the shell pages fetched on install.
  That matches the AC ("after first visit").
- We own correctness. Mitigation: the rules are pure functions tested in Vitest, and the e2e suite (BRAIN-30) goes
  offline in a real browser.
- Bump `VERSION` when the worker's logic changes, so clients replace their caches.

## Alternatives considered

- **Serwist with webpack builds.** Rejected: slower builds, off the default path, for a feature this size.
- **No offline support.** Rejected: the PRD lists an offline shell in v1, and the map is most useful exactly when
  someone is revising without a connection (a train, a flight before an interview).
