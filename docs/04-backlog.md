# Backlog

Format: `BRAIN-n · type · priority · estimate` then acceptance criteria. Types: feat, chore, docs, bug, spike.
Priority: P0 blocks the milestone, P1 should ship in it, P2 nice to have. Estimates in ideal engineering days (d) or hours (h).
Every ticket here is mirrored as a GitHub Issue with the ticket id in the title; the issue is the live status, this file is the plan.
Ticket ids and issue numbers are independent (PRs share the issue counter): BRAIN-17 is issue #22, BRAIN-18 is #23, and BRAIN-19 to BRAIN-33 are #40 to #54.

## M0 — Foundation

**BRAIN-1 · chore · P0 · 2h — Initialise monorepo** (EPIC-1)
AC: pnpm workspace with `apps/web`, `packages/{content,graph-engine,config}`; Turborepo `build`, `dev`, `lint`, `test`, `typecheck` pipelines; `pnpm -r typecheck` passes on empty packages.

**BRAIN-2 · chore · P0 · 2h — Scaffold Next.js app** (EPIC-1)
AC: Next 16 App Router, React 19, TS strict + `noUncheckedIndexedAccess`, Tailwind v4, shadcn init; `/` renders a placeholder; React Compiler enabled.

**BRAIN-3 · chore · P0 · 2h — Lint, format, hooks** (EPIC-1)
AC: ESLint 9 flat config (next, typescript-eslint, jsx-a11y), Prettier, Husky pre-commit with lint-staged, commitlint with Conventional Commits; a bad commit message is rejected.

**BRAIN-4 · chore · P0 · 3h — CI workflow** (EPIC-2)
AC: GitHub Actions on PR and main: install (cached), typecheck, lint, unit, build; required check for merge; runs under 5 min.

**BRAIN-5 · chore · P0 · 1h — Vercel project + previews** (EPIC-2)
AC: production on `main`, preview per PR with URL commented on the PR; `.env.example` committed.

**BRAIN-6 · chore · P1 · 1h — Sentry + Speed Insights** (EPIC-2)
AC: an intentional error on a preview appears in Sentry with release tag; Speed Insights shows data.

**BRAIN-7 · docs · P0 · 1d — Engineering docs v1** (EPIC-3)
AC: PRD, system design, roadmap, backlog, process, ADR-0001..0007, templates committed; GitHub Issues created for M0 and M1; project board with columns Backlog / Ready / In progress / In review / Done.

**BRAIN-8 · docs · P1 · 2h — README + CONTRIBUTING + issue/PR templates** (EPIC-3)
AC: README explains the product in one screen and links docs; CONTRIBUTING covers content PRs and the state rule (ADR-0006); templates in `.github/`.

**BRAIN-17 · chore · P1 · 1h — Apply the main ruleset and remove the admin bypass** (EPIC-2) · #22
AC: repo visibility decided; ruleset applied with `verify` and `commits` required; admin bypass removed after the M0 stack merges; a PR with a failing check cannot merge.

## M1 — Engine + content

**BRAIN-9 · feat · P0 · 3h — Content schemas** (EPIC-4)
AC: Zod schemas for Domain, Node, Edge; Velite config emits typed JSON; a schema violation fails `pnpm build` with a readable message.

**BRAIN-10 · feat · P0 · 4h — Port mockup content** (EPIC-4)
AC: all 144 nodes and 278 edges from `mockup/brain-graph.html` as YAML; every node has `summary`; `verified: 2026-11-16`.

**BRAIN-11 · feat · P0 · 3h — Graph validator** (EPIC-4)
AC: fails on duplicate ids, unknown endpoints, self-loops, disconnected nodes, nodes without sources (warning in M1, error in M4); runs in CI; unit-tested with fixtures.

**BRAIN-12 · feat · P0 · 2h — `buildGraph` + `shortestPath`** (EPIC-5)
AC: adjacency with direction and relation; BFS path; tests: known pairs, unreachable pair, path length bounds over the real content (≤ 7 hops for 95% of random pairs, as in the PRD).

**BRAIN-13 · feat · P0 · 1d — Simulation wrapper** (EPIC-5)
AC: `add(ids, aroundId)` ring placement, `remove`, `reheat`, `pin/unpin`; forces match the mockup values; deterministic with a seeded RNG in tests.

**BRAIN-14 · feat · P0 · 2d — Renderer** (EPIC-6)
AC: class with canvas, DPR, transform, dirty flag, demand-driven rAF loop that pauses when hidden; `draw()` ported from the mockup (nodes, edges, labels, badges, focus dimming, halo); reduced-motion collapses tweens; tests count draw calls via a canvas mock.

**BRAIN-15 · feat · P1 · 4h — Animation clocks** (EPIC-6)
AC: node pop-in with stagger, edge grow, route progressive draw and pulse, as in mockup v3; all timings in one constants file.

**BRAIN-18 · chore · P2 · 2h — Automated dependency updates** (EPIC-2) · #23
AC: Dependabot or Renovate for npm and github-actions, weekly, grouped; SHA pins keep version comments; typescript-eslint, eslint-config-next and the pnpm override move together.

**BRAIN-16 · spike · P2 · 4h — Worker layout feasibility** (EPIC-5)
AC: prototype d3-force in a Web Worker posting `Float32Array` positions; note in `journal/` with frame timings at 500 and 1500 nodes; decision recorded as ADR if adopted.

## M2 — Explore

Written at M1 close (2026-11-17).

**BRAIN-19 · feat · P0 · 1.5d — Explore stage** (EPIC-7) · #40
AC: /explore renders the map with the 8 seed concepts; click unfolds a concept's hidden neighbours on a ring, 12 at a time with "Unfold N more" for hubs; fold, drag, pan, zoom work as in mockup v3; canvas colours follow the theme tokens and update on theme change; engine state lives in a Zustand vanilla store; React does not re-render per frame; unit tests for the store and controller.

**BRAIN-20 · feat · P0 · 1.5d — Panels: search, legend, trail, card, controls** (EPIC-8) · #41
AC: top bar with brand, search ("/" focuses, arrows and Enter pick, Esc closes) and zoom, fit, unfold-all, reset controls; legend with per-layer visible counts and toggles; trail of the last 6 visited concepts; detail card with domain, summary, Unfold or Fold, "drives" and "driven by" lists that reveal and select; mobile layout: card becomes a bottom sheet, legend and trail hidden; all controls have accessible names.

**BRAIN-21 · feat · P1 · 3h — URL state** (EPIC-7) · #42
AC: ?n=<id> selects and reveals a concept on load; ?layers=a,b restricts active layers; parsed with Zod; unknown ids ignored without errors; uRL updated with replaceState, debounced, no history spam; unit tests for parse and serialise.

**BRAIN-22 · feat · P1 · 1d — Local progress with Redux and IndexedDB** (EPIC-9) · #43
AC: redux Toolkit store for progress events, bookmarks and settings (ADR-0006); listener middleware persists to Dexie; state restored on load; card shows a bookmark toggle; legend shows explored count; export and import progress as JSON; if IndexedDB is unavailable the app still works and shows one notice; reducer and persistence tests.

**BRAIN-23 · feat · P1 · 4h — Theme toggle and accessibility base** (EPIC-10) · #44
AC: theme control: system, dark, light; saved in settings; no flash on load; skip link and visible focus on every control; the map announces the selected concept in a live region; keyboard: Tab reaches the canvas, arrow keys move between visible neighbours, Enter unfolds, Esc clears; reduced motion honoured by canvas and CSS.

## M3 — Route + reference

**BRAIN-24 · feat · P0 · 1.5d — Route mode** (EPIC-11) · #45
AC: explore/Route toggle; pick start then destination on the map, from search, or from the card; shortest path revealed and drawn hop by hop with the pulse; route card lists hops with relations, highlighting in sync with the pulse; replay, Reverse, Clear; "no path" state; ?from=&to= deep links open a drawn route; store tests for route flow.

**BRAIN-25 · feat · P0 · 1d — Concept pages** (EPIC-12) · #46
AC: /concept/[id] statically generated for every concept; shows summary, domain, drives and driven by with links, sources, verified date; "Shortest route to" a few hub concepts, as text; "Open in map" deep link; valid HTML headings and landmarks; works with JS off.

**BRAIN-26 · feat · P0 · 4h — Cheatsheet** (EPIC-13) · #47
AC: /cheatsheet lists every concept grouped by domain with summary; client-side filter by text and layer; print stylesheet: one clean column, no chrome; linked from the map and concept pages.

**BRAIN-27 · feat · P1 · 4h — Metadata: OG images, sitemap, robots, manifest** (EPIC-14) · #48
AC: open Graph image per concept and for the site, generated at build; sitemap.xml lists all pages; robots.txt points to it; web app manifest and icons; theme colours match tokens; canonical URLs from the site URL.

**BRAIN-28 · feat · P1 · 4h — Offline shell** (EPIC-14) · #49
AC: service worker caches the app shell, the map and concept pages after first visit; second visit with network off loads /explore and visited concept pages; updates take effect on next load; no stale-forever cache; registered only in production builds.

**BRAIN-29 · feat · P1 · 3h — Home page** (EPIC-12) · #50
AC: / explains the product in one screen with a primary "Open the map" action; three example routes that open in Route mode; links to cheatsheet and docs; static, no client JS beyond Next's runtime.

## M4 — Launch

**BRAIN-30 · chore · P0 · 1d — Quality gates: e2e, accessibility, bundle and frame budgets** (EPIC-15) · #51
AC: playwright e2e for explore, search, route, concept page and cheatsheet in CI; axe scan with zero serious or critical violations on every page, both themes; bundle budget: /explore first-load JS ≤ 250 KB gzipped, enforced in CI; frame timing during unfold measured in Chromium and recorded.

**BRAIN-31 · chore · P0 · 3h — Security headers and CSP** (EPIC-15) · #52
AC: cSP with no unsafe-inline scripts, allowing only Vercel analytics and Sentry when configured; hSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, frame-ancestors none; headers verified by a test against the built app.

**BRAIN-32 · feat · P0 · 1.5d — Content drive: sources and cross-links** (EPIC-16) · #53
AC: every concept has at least one source from a spec, MDN, web.dev or an engine blog, and every URL resolves; missing sources become a build error; at least 150 concepts; cross-links that shorten the longest routes found in BRAIN-16 and BRAIN-12; verified dates updated.

**BRAIN-33 · docs · P0 · 4h — Launch** (EPIC-17) · #54
AC: rEADME final with screenshots and links; cHANGELOG for v1.0.0 and drafted release notes; retros for M1 to M4 in journal; launch post draft; release tagged after the stack merges.
