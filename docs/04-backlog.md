# Backlog

Format: `BRAIN-n · type · priority · estimate` then acceptance criteria. Types: feat, chore, docs, bug, spike.
Priority: P0 blocks the milestone, P1 should ship in it, P2 nice to have. Estimates in ideal engineering days (d) or hours (h).
Every ticket here is mirrored as a GitHub Issue with the same id in the title; the issue is the live status, this file is the plan.

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

**BRAIN-16 · spike · P2 · 4h — Worker layout feasibility** (EPIC-5)
AC: prototype d3-force in a Web Worker posting `Float32Array` positions; note in `journal/` with frame timings at 500 and 1500 nodes; decision recorded as ADR if adopted.

## M2 — Explore (epics listed; tickets written at M1 close)

EPIC-7 Explore stage (BRAIN-17..21) · EPIC-8 Panels & search (BRAIN-22..28) · EPIC-9 State & local storage (BRAIN-29..33) · EPIC-10 Theming & a11y base (BRAIN-34..36)

## M3 — Route + reference (epics listed)

EPIC-11 Route mode · EPIC-12 Concept pages · EPIC-13 Cheatsheet · EPIC-14 Offline & metadata

## M4 — Launch (epics listed)

EPIC-15 Quality gates · EPIC-16 Content drive · EPIC-17 Launch
