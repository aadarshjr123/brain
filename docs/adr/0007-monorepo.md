# ADR-0007: pnpm workspaces + Turborepo monorepo from day one

| | |
|---|---|
| Status | Accepted |
| Date | 2026-11-16 |
| Deciders | Aadarsh, Claude |

## Context
The graph engine and the content are independent of the UI and will outlive it. We also want their tests to run in isolation and their APIs to stay clean.

## Decision
One repository with `apps/web`, `packages/content`, `packages/graph-engine`, `packages/config`. Turborepo runs and caches tasks.

## Consequences
Clean boundaries enforced by package imports. Slight setup cost. A future 3D view, CLI validator or native app reuses the packages.

## Alternatives considered
Single Next.js app with folders: faster to start, boundaries erode.
