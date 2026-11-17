# Brain — engineering docs

This folder is the single source of truth for how Brain is built and why. Everything here is also mirrored on GitHub
(issues, project board, discussions) so the history is visible in both places. See `05-process.md` for the rules.

| Doc                                        | What it answers                                                                |
| ------------------------------------------ | ------------------------------------------------------------------------------ |
| [01-prd.md](01-prd.md)                     | What problem are we solving, for whom, and how do we know we succeeded         |
| [02-system-design.md](02-system-design.md) | How the system is shaped, its budgets, failure modes and trade-offs            |
| [03-roadmap.md](03-roadmap.md)             | Milestones and epics, in order                                                 |
| [04-backlog.md](04-backlog.md)             | The ticket backlog (mirrored to GitHub Issues)                                 |
| [05-process.md](05-process.md)             | How we work: tickets, branches, reviews, retros, logging                       |
| [adr/](adr/)                               | Architecture Decision Records, one per decision, never edited after acceptance |
| [journal/](journal/)                       | Dated engineering journal: problems hit, what we learned, what changed         |
| [templates/](templates/)                   | Ticket, ADR, RFC, retro and postmortem templates                               |
| [runbooks/](runbooks/)                     | How to deploy, roll back and cut a release                                     |
| [release-notes/](release-notes/)           | What each release contains, for users                                          |
| [launch/](launch/)                         | Launch post draft                                                              |
| [../CHANGELOG.md](../CHANGELOG.md)         | Every release, newest first                                                    |
| [../PLAN.md](../PLAN.md)                   | The stack and phase plan (implementation view of this folder)                  |

## Decisions so far

| ADR                                               | Decision                                                       |
| ------------------------------------------------- | -------------------------------------------------------------- |
| [0001](adr/0001-record-architecture-decisions.md) | Record architecture decisions                                  |
| [0002](adr/0002-nextjs-over-spa.md)               | Next.js over a single-page app                                 |
| [0003](adr/0003-canvas-2d-rendering.md)           | Canvas 2D for the map, not SVG or WebGL                        |
| [0004](adr/0004-content-in-repo.md)               | Content lives in the repo                                      |
| [0005](adr/0005-no-accounts-local-progress.md)    | No accounts; progress stays in the browser                     |
| [0006](adr/0006-state-split-redux-zustand.md)     | Zustand for engine state, Redux for domain state               |
| [0007](adr/0007-monorepo.md)                      | Monorepo with pnpm and Turborepo                               |
| [0008](adr/0008-typescript-6-pin.md)              | Pin TypeScript 6.0 until the lint stack supports 7             |
| [0009](adr/0009-content-compiler-over-velite.md)  | A small Zod + YAML compiler instead of Velite                  |
| [0010](adr/0010-hand-written-service-worker.md)   | A hand-written service worker instead of Serwist               |
| [0011](adr/0011-csp-for-static-pages.md)          | CSP for static pages: inline scripts allowed, Trusted Types on |
