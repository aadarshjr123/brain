# System design — Brain

Status: v1, 2026-11-16. Companion to the PRD. Decisions referenced as ADR-xxxx live in `adr/`.

## 1. Requirements

Functional: explore graph, route between concepts, concept pages, search, cheatsheet, local progress, offline shell.

Non-functional:

- Performance budgets: LCP < 2.5 s, INP < 200 ms, CLS < 0.1 (p75, mobile). JS on `/explore` ≤ 250 KB gzipped. 60 fps during unfold and route animations on a 2020 mid-range laptop.
- Scale: content grows to ~500 nodes / ~1500 edges over two years. Traffic: spiky, small (hundreds to low thousands of daily users). No write path from users to a server.
- Availability: static. If the CDN is up, the product is up.
- Correctness: content is validated at build; a bad graph cannot deploy.
- Accessibility: WCAG 2.2 AA for all DOM views; canvas has keyboard-reachable equivalents.

## 2. High-level architecture

```mermaid
flowchart LR
  subgraph repo[Repository]
    C[content/*.yaml, *.mdx] --> V[Velite build + validator]
    V --> J[graph.json + notes]
  end
  subgraph build[Next.js build on Vercel]
    J --> SSG[Static pages: /, /concept/[slug], /cheatsheet]
    J --> E[Explore bundle: client island]
  end
  subgraph browser[Browser]
    SSG --> DOM[Server-rendered HTML]
    E --> R[Renderer: canvas, d3-force]
    E --> Z[Zustand engine store]
    E --> X[Redux: progress, settings]
    X --> D[(Dexie / IndexedDB)]
    SW[Service worker, ADR-0010] --> DOM
    SW --> E
  end
  CDN[Vercel edge CDN] --> browser
```

There is no application server. Everything is built at deploy time and served from the edge.

## 3. Components

### 3.1 Content pipeline

- Source: `packages/content/{domains.yaml, nodes/*.yaml, edges.yaml, notes/*.mdx}`.
- Velite parses with Zod schemas and emits typed JSON. A custom validator runs after: unique ids, every edge endpoint exists, no self-loops, graph connected, every node has `summary` and ≥ 1 `source`, relation text ≤ 40 chars.
- Output is imported statically by pages and shipped as one JSON chunk (~60 KB gzipped at 500 nodes).

### 3.2 Graph engine (`packages/graph-engine`, framework-free)

- `buildGraph(nodes, edges)` → adjacency map, degrees.
- `shortestPath(a, b, weights?)` → BFS now, Dijkstra when weights land. O(V+E), microseconds at this size.
- `Simulation`: wraps d3-force; `add(ids, around)` places new nodes in a ring, `remove(ids)`, `reheat()`.
- `Renderer`: owns canvas, DPR, transform, hit testing, dirty flag, rAF loop, animation clocks. `draw(state, now)` is a pure function of engine state. Draws only when dirty or animating; pauses when hidden.
- Tested with Vitest; the renderer's draw is tested through a canvas mock for call counts, not pixels.

### 3.3 Explore client island (`apps/web`)

- `Stage.tsx` mounts the Renderer and wires pointer, zoom and drag to Zustand actions.
- Panels (TopBar, Search, Legend, Trail, DetailCard, RouteCard) are React components reading Zustand via selectors and Redux via hooks.
- URL is state: `?n=` for selection, `?from=&to=` for routes, `?layers=` for filters. Parsed with Zod, applied on load, updated with `replaceState` (debounced).

### 3.4 State (ADR-0006)

- Zustand (vanilla store): per-frame and transient engine state. Renderer subscribes directly.
- Redux Toolkit: progress events, settings, bookmarks, session. Listener middleware persists to Dexie. DevTools and replay for free.
- No TanStack Query in v1: nothing comes from a server.

### 3.5 Storage (ADR-0005)

- Dexie tables `events`, `bookmarks`, `notes`, `settings`. Append-only events; mastery derived in a Redux selector.
- Export/import as JSON. No server, no sync, no accounts.

### 3.6 Static pages

- `/concept/[slug]`: summary, MDX note, "drives" and "driven by" lists, top routes to hub concepts, sources, "open in map" link. `generateStaticParams` from content.
- `/cheatsheet`: all concepts grouped by domain, filterable, printable. The accessible, text-first twin of the map.
- OG image per concept via `opengraph-image.tsx`.

### 3.7 Offline

- A hand-written service worker (ADR-0010): pages network-first with an offline copy, hashed assets cache-first, other same-origin files stale-while-revalidate. The content ships inside the explore bundle, so caching the bundle caches the graph.

## 4. Data model

```ts
Domain   { id; name; color: token }
Node     { id; label; domain; summary; aliases?: string[]; sources: { title; url }[]; verified: date; note?: slug }
Edge     [from, to, relation, weight?: 1|2|3]
Event    { id; type: 'explored'|'routed'|'quizzed'; conceptId; payload; ts }
Progress { conceptId → { seen: number; lastSeen: ts; mastery: 0..5 } }   // derived
```

## 5. Key flows

**Unfold**: pointer up → hit test → `engine.expand(id)` (ring placement, born timestamps) → simulation reheats → renderer dirty → Zustand `visible` updated → Redux `progress/explored` → Dexie append.

**Route**: two picks → `shortestPath` → reveal nodes along path → `routeStart = now` → renderer draws progressively, pulse loops → RouteCard syncs hop highlight from the renderer's `hopNow` via a throttled Zustand field.

**Deep link**: `/explore?from=set_state&to=gpu_process` → Zod parse → engine reveals path → fit view → RouteCard rendered server-side as a fallback list for crawlers and screen readers.

## 6. Performance design

- Canvas 2D, not DOM or SVG, for the map (ADR-0003). Nodes and edges are draw calls, not elements.
- Render loop is demand-driven. Idle map costs zero CPU.
- Labels: hub-only below zoom 0.55, all above 0.9, neighbours of focus always.
- Unfold reveals at most 12 at a time; "show more" badge for the rest (prevents clutter and layout spikes).
- Force simulation moves to a Web Worker when nodes > 300; positions transferred as `Float32Array`.
- Explore bundle code-split from the rest; d3 imported as individual packages; React Compiler on.
- Fonts: two families, `display=swap`, preloaded.

## 7. Failure modes

| Failure                              | Effect                  | Handling                                                          |
| ------------------------------------ | ----------------------- | ----------------------------------------------------------------- |
| Invalid content merged               | Broken graph            | Validator fails CI, cannot deploy                                 |
| Canvas unsupported / JS off          | No map                  | Concept pages and cheatsheet are server-rendered and fully usable |
| IndexedDB blocked (private mode)     | Progress not saved      | Dexie wrapped; app runs stateless, toast once                     |
| Huge unfold (hub with 40 neighbours) | Clutter, frame drop     | Paged unfold, collide force, worker layout later                  |
| CDN edge stale after deploy          | Old content for minutes | Acceptable; content is not time-critical                          |

## 8. Security and privacy

Static site, no user data leaves the device. CSP with `script-src 'self'` plus Vercel analytics, no inline scripts
(Next.js nonce). No third-party cookies. Sentry scrubs URLs of nothing sensitive because there is nothing sensitive.

## 9. Observability

Sentry for runtime errors with release tags. Vercel Speed Insights for vitals. A small custom event
(`explore.unfold`, `route.computed`, `search.hit`) through Vercel Analytics to learn which concepts people use.
No personal identifiers.

## 10. Trade-offs considered

| Decision                         | Alternative    | Why we chose this                                                            |
| -------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| Next.js (ADR-0002)               | Vite SPA       | Static concept pages, OG images, MDX, contributor familiarity                |
| Canvas 2D (ADR-0003)             | SVG / Three.js | SVG dies past ~300 nodes with labels; 3D hurts readability of labelled edges |
| Content in repo (ADR-0004)       | CMS / database | Review by PR, versioned facts, no server                                     |
| No accounts (ADR-0005)           | Auth + sync    | Product is a reference; accounts add cost and friction for no v1 value       |
| Redux + Zustand split (ADR-0006) | One store      | Per-frame state and replayable domain state have opposite needs              |
| Monorepo (ADR-0007)              | Single app     | Engine and content outlive UI decisions                                      |
