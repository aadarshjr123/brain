# Changelog

All notable changes to Brain. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the
project uses [Semantic Versioning](https://semver.org/). Release notes for users live in `docs/release-notes/`.

## [1.0.0] - unreleased (tagged when the M0 to M4 stack merges)

### Added

- **Map** at `/explore`: 152 concepts and 301 named relations across eight layers. Click to unfold up to 12
  neighbours at a time, drag, pan, zoom, fold, unfold everything, reset. Ported from the v3 mockup.
- **Route mode**: shortest chain between two concepts, drawn hop by hop with a travelling pulse and narrated in a card
  that follows it. Replay, reverse, clear. Shareable with `?from=&to=`.
- **Search** (press `/`), layer filters, trail of recent concepts, and links that restore the map (`?n=`, `?layers=`).
- **Concept pages** at `/concept/[id]` for every concept: relations, routes to hub concepts, source, verified date.
- **Cheatsheet** at `/cheatsheet`: every concept by layer, filterable, printable as one clean column.
- **Home page** with three example routes.
- **Local progress**: views and bookmarks in IndexedDB, export and import as JSON. No account.
- **Themes**: system, dark and light, with no flash on load.
- **Keyboard and screen readers**: focusable map with arrow-key navigation, announcements, skip link.
- **Offline**: the map, the cheatsheet and visited pages work without a network after the first visit.
- **Sharing**: an Open Graph image per concept, sitemap, robots, web app manifest and icons.
- **Security headers**: CSP without external scripts or eval, Trusted Types, HSTS and more (ADR-0011).
- **Monitoring**: Vercel Speed Insights and Analytics; Sentry when a DSN is configured.

### Engineering

- Monorepo (pnpm, Turborepo); strict TypeScript; type-aware lint with strict accessibility rules; Conventional Commits.
- CI: format, typecheck, lint, 146 unit tests, build, JavaScript budget, 31 end-to-end tests with axe in both themes,
  commit lint. Weekly source-link check. Dependabot with grouped updates and a single-version guard.
- Eleven architecture decision records; a journal, three learning issues and four milestone retros.
