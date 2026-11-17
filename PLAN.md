# Brain — professional project plan

Brain is a public, free, no-login study map and reference that connects what frontend developers do with what the browser does.
The agreed design is the v3 mockup in `mockup/brain-graph.html`. This plan sets up the project the way a production
web product is set up today, so it can grow from a personal relearning tool into something others use and contribute to.

---

## 1. Next.js or plain React?

Use **Next.js**. The graph itself is a client-only canvas and gains nothing from a server, but everything you will build
around the graph does:

- **A page per concept** (`/concept/event-loop`) rendered statically: shareable links, SEO, fast first paint, Open Graph images.
- **MDX deep-dive notes** per concept with type-safe frontmatter, built at compile time.
- **A backend if one is ever needed** (contribution tooling, AI explanations) without a second repo. v1 has none.
- **The industry default.** Most React teams, job postings and open-source contributors already know the App Router. That matters once others join.

The trade: the canvas stage is a `'use client'` island loaded with `next/dynamic` (`ssr: false`). Everything else can be server components.

---

## 2. Stack

| Layer           | Choice                                                                                                       | Notes                                                                                                                                 |
| --------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | **Next.js 16** (App Router, Turbopack), **React 19**, React Compiler on                                      | TypeScript `strict`, `noUncheckedIndexedAccess`                                                                                       |
| Language        | **TypeScript 5.x**                                                                                           | No `any` in `src/`. Zod at every boundary (content, URL params, API).                                                                 |
| Styling         | **Tailwind CSS v4** + **shadcn/ui**                                                                          | Tokens from the mockup become CSS variables in `globals.css`; shadcn components for cards, sheets, command palette, toasts.           |
| Animation       | **motion** (panels) + hand-written time-based tweens in the canvas renderer                                  | Canvas animation is driven by the frame clock, never by React state.                                                                  |
| Graph rendering | **Canvas 2D renderer** (ported from the mockup) + `d3-force`, `d3-zoom`, `d3-drag`                           | Lives in `packages/graph-engine`, framework-free, so it can be reused in a 3D or native view later.                                   |
| App state       | **Redux Toolkit 2** (+ RTK devtools, redux-persist)                                                          | Domain state that must be serialisable, inspectable and replayable: learning progress, settings, bookmarks, session history. See §4a. |
| Engine state    | **Zustand 5** (vanilla store)                                                                                | High-frequency, transient state the canvas needs outside React: hover, drag, camera, animation clocks, selection. See §4a.            |
| Server state    | **TanStack Query 5** (deferred)                                                                              | No backend in v1, so nothing for it to cache. Add when a server-side feature appears (see ADR-0005).                                  |
| Local storage   | **Dexie (IndexedDB)** + redux-persist for settings                                                           | All personal progress lives on the device. Export/import as JSON. No accounts (ADR-0005).                                             |
| Database / Auth | **None in v1**                                                                                               | The product is a public reference. Content is in the repo, progress is local.                                                         |
| Content         | **Velite** (or Content Collections) with Zod schemas                                                         | `content/nodes/*.yaml`, `content/edges.yaml`, `content/notes/*.mdx`. Type-safe, validated at build.                                   |
| Search          | **MiniSearch** on the client; **cmdk** (via shadcn Command) for the palette                                  |                                                                                                                                       |
| Testing         | **Vitest** + **Testing Library**, **Playwright** e2e, **Storybook 9** for UI components                      | Graph engine has 100% unit coverage target; UI smoke tests only.                                                                      |
| Quality         | **ESLint 9 flat config** (next, typescript-eslint, jsx-a11y) + **Prettier**                                  | Biome is fine too, but the Next.js ecosystem plugins are ESLint-first.                                                                |
| Git hygiene     | **Husky** + **lint-staged**, **Conventional Commits** (commitlint), **Changesets** for package versions      |                                                                                                                                       |
| CI/CD           | **GitHub Actions**: typecheck, lint, unit, build, e2e on PR; **Vercel** preview per PR, production on `main` | See §4c for hosting.                                                                                                                  |
| Monitoring      | **Vercel Analytics + Speed Insights**, **Sentry**                                                            | An app about Core Web Vitals should track its own.                                                                                    |
| PWA             | **Serwist**                                                                                                  | On topic: the app about service workers ships one.                                                                                    |
| Package manager | **pnpm** workspaces + **Turborepo**                                                                          | Light monorepo from day one (see layout).                                                                                             |

---

## 3. Repository layout (pnpm + Turborepo)

```
brain/
  apps/
    web/                       Next.js app
      app/
        (marketing)/page.tsx           landing
        explore/page.tsx               the graph (client island)
        concept/[slug]/page.tsx        static page per node, MDX note, "touches" lists, route links
        cheatsheet/page.tsx            reference list view (Phase 4)
        learn/…                        quiz / review (Phase 5)
        opengraph-image.tsx
      components/                      Stage, TopBar, Search, Legend, Trail, DetailCard, RouteCard
      stores/                          graphStore.ts, uiStore.ts
      lib/                             url-state, keyboard, analytics
      styles/globals.css               tokens (light + dark)
  packages/
    content/                   YAML + MDX source of truth, Velite config, build-time validation
    graph-engine/              framework-free: buildGraph, shortestPath, Simulation, Renderer, easing
    ui/                        shared shadcn components + tokens (if a second app ever appears)
    config/                    eslint, tsconfig, prettier presets
  .github/workflows/ci.yml
  turbo.json  pnpm-workspace.yaml  package.json
```

Why a monorepo for one app: the graph engine and the content are the two things that will outlive any UI decision.
Keeping them as packages with their own tests forces clean boundaries and makes a future 3D view, CLI validator,
or mobile app trivial. Turborepo caches builds so it costs nothing day to day.

---

## 4. Architecture

```
content (YAML/MDX)  →  Velite build  →  typed Graph  →  Zustand store  →  Renderer (canvas, imperative)
                                                                    ↘   React panels (server + client components)
```

Rules:

1. **Renderer is a class** created once in `Stage.tsx`; it owns canvas, transform, positions, dirty flag and the rAF loop.
2. **React never runs per frame.** The renderer subscribes to the store and marks itself dirty; panels re-render on store changes only.
3. **Draw only when dirty or animating**, pause when `document.hidden`. Reduced-motion collapses tweens to instant.
4. **Positions stay in the engine**, the store holds ids and modes. Later the simulation moves to a Web Worker and ships `Float32Array` positions.
5. **URL is state**: `/explore?n=event_loop`, `/explore?from=set_state&to=gpu_process`. Every view is linkable.
6. **Content is the product.** PRs that only touch `packages/content` must pass the validator (ids, duplicates, reachability, relation grammar) and preview on Vercel.

### 4a. State management: who owns what

Three stores, three jobs, no overlap.

| Store                 | Holds                                                                                                                                         | Why this tool                                                                                                                                          |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Redux Toolkit**     | `progress` (concepts seen, routes taken, quiz results), `settings` (theme, reduced motion, layers), `bookmarks`, `session` (trail, last view) | Serialisable, time-travel devtools, middleware for analytics and persistence, predictable for contributors. Persisted with redux-persist to IndexedDB. |
| **Zustand (vanilla)** | `hover`, `selected`, `mode`, `routeA/B/path`, `visible` set, camera transform, drag target, animation timestamps                              | Updated many times per second. The Renderer subscribes with `store.subscribe` and never goes through React. No reducers, no serialisation cost.        |
| **TanStack Query**    | Nothing in v1. Reserved for a future server feature.                                                                                          | Listed so contributors do not reach for it for local data.                                                                                             |

Flow for one user action, "unfold Event loop":

1. Stage → Zustand: `visible` grows, renderer marks dirty, animation plays.
2. Zustand middleware emits a domain event → Redux `progress/conceptExplored`.
3. Redux listener middleware appends the event to Dexie.
4. The map re-reads mastery from Redux and tints explored nodes.

Rule of thumb for contributors: if the Renderer needs it per frame, Zustand. If you would want to see it in Redux DevTools or replay it, Redux.

### 4b. Storage: local only, exportable

- **Dexie** tables: `events` (append-only log of what you explored and answered), `bookmarks`, `notes` (personal markdown per concept), `settings` mirror.
- Progress is per device. An **Export / Import** button moves it as a JSON file. That is the whole sync story for v1 and it is deliberate (ADR-0005).
- Serwist caches the app shell and the content bundle so the map opens offline.
- Content (nodes, edges, MDX notes) is **not** user data. It lives in the repo, versioned and reviewed by PR, built by Velite into a static JSON the app loads once.

### 4c. Hosting

| Piece                                        | Where                                                                       | Notes                                                                                                |
| -------------------------------------------- | --------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Next.js app (static export + ISR not needed) | **Vercel** Hobby                                                            | Preview URL per PR, production on `main`, global CDN, Speed Insights. Alternative: Cloudflare Pages. |
| Domain                                       | Cloudflare Registrar + DNS                                                  | Optional; `brain.vercel.app` is fine for v1.                                                         |
| Monitoring                                   | Sentry (errors), Vercel Analytics + Speed Insights (vitals)                 | An app about Core Web Vitals tracks its own.                                                         |
| Secrets                                      | Only `SENTRY_DSN` and analytics ids; `.env.example` committed, `.env` never |                                                                                                      |
| Environments                                 | `local`, `preview` (every PR), `production`                                 | No database, so no migrations in CI.                                                                 |

Expected cost: $0.

Content model:

```ts
Node  { id; label; domain; summary; note?: mdx; aliases?: string[]; sources?: Url[] }
Edge  [from, to, relation, { weight?: 1|2|3, since?: string }]
```

Relation text reads from → to. `weight` lets Route prefer strong mechanical links.

---

## 5. Phases

**Phase 0 — Foundation (1 to 2 days)**
Turborepo + pnpm, Next.js 16 app, Tailwind v4 + shadcn init, ESLint/Prettier/Husky/commitlint, CI workflow, Vercel project, Sentry DSN. Empty pages deploy green.

**Phase 1 — Content + engine (3 to 4 days)**
Port nodes/edges from the mockup into `packages/content` as YAML. Velite schemas. `graph-engine`: `buildGraph`, `shortestPath` (BFS, then weighted Dijkstra), `Simulation` wrapper with ring unfold, `Renderer` with the mockup's draw code. Vitest for all of it.

**Phase 2 — Explore page + local storage (5 to 6 days)**
Stage island, Zustand engine store, Redux slices (`settings`, `session`, `progress`) with redux-persist, Dexie event log, TopBar, Command palette search, Legend, Trail, DetailCard, Toasts, URL state, keyboard, both themes. Playwright smoke: load, unfold, search, select, reload keeps progress.

**Phase 3 — Route + concept pages (3 days)**
Route mode with progressive draw and pulse, RouteCard sync, replay/reverse. `/concept/[slug]` static pages with MDX notes and OG images. Sitemap. PWA via Serwist.

**Phase 4 — Reference layer (3 to 4 days)**
Cheatsheet view: every concept as a scannable list grouped by domain, printable, searchable, deep-linkable. Export/import of local progress. Sentry and Speed Insights wired.

**Phase 5 — Learning layer (later)**
Recall quiz, spaced-repetition review queue, mastery per concept shown on the map, personal notes per concept, analytics events for what people explore.

**Phase 6 — Growth (later)**
Contribution guide for content PRs, weighted routes, "explain this route" with an LLM, optional 3D view with React Three Fiber (instanced nodes, one line geometry, on-demand frame loop), Web Worker layout once nodes pass ~500.

---

## 6. Definition of done per PR

- Typecheck, lint, unit tests, build and e2e pass in CI.
- Lighthouse on the Vercel preview: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 on `/explore` and one concept page.
- Content changes pass the graph validator.
- Conventional commit, Changeset if a package's public API changed.

---

## 7. Bootstrap commands

```sh
pnpm dlx create-turbo@latest brain --package-manager pnpm   # choose the "basic" template, remove the docs app
cd brain
pnpm dlx create-next-app@latest apps/web --ts --tailwind --eslint --app --src-dir=false --turbopack
cd apps/web && pnpm dlx shadcn@latest init && cd ../..
pnpm add -w -D prettier husky lint-staged @commitlint/cli @commitlint/config-conventional @changesets/cli
pnpm --filter web add zustand @reduxjs/toolkit react-redux redux-persist dexie d3-force d3-zoom d3-drag d3-selection minisearch motion zod velite
pnpm --filter web add @sentry/nextjs
pnpm --filter web add -D @types/d3-force @types/d3-zoom @types/d3-drag @types/d3-selection vitest @testing-library/react @playwright/test @serwist/next
```
