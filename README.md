# Brain

A free, public study map of how frontend development touches the browser. Click a concept to unfold what it
connects to, or pick two concepts and get the shortest chain of cause and effect between them, explained hop by hop.
No login. Also usable as a cheatsheet.

> **Status:** in active development. The agreed design is the mockup at `mockup/brain-graph.html`.
> Milestones and progress live on the [project board](https://github.com/users/aadarshjr123/projects/3).

## What is in the box

| Path                    | What it is                                                                  |
| ----------------------- | --------------------------------------------------------------------------- |
| `apps/web`              | The Next.js app: map, concept pages, cheatsheet                             |
| `packages/content`      | Every fact: domains, concepts and relations as YAML, compiled and validated |
| `packages/graph-engine` | Framework-free graph model, shortest path, force layout and canvas renderer |
| `packages/config`       | Shared TypeScript, ESLint and Prettier configuration                        |
| `docs/`                 | PRD, system design, roadmap, backlog, process, ADRs, runbooks, journal      |

## Run it locally

Requirements: Node 24 (see `.nvmrc`) and pnpm 11 (`corepack enable` picks the pinned version).

```sh
pnpm install
pnpm dev          # http://localhost:3000
```

Everyday commands, all run through Turborepo from the repo root:

```sh
pnpm check        # typecheck + lint + unit tests, what CI runs
pnpm build        # production build of every package
pnpm format       # Prettier on the whole repo
```

## How the project is run

This is run like a product team's project: problem statement, decisions, tickets, reviews and retros are all written
down. Start with [`docs/README.md`](docs/README.md).

- Product and engineering docs: [`docs/`](docs/README.md)
- Architecture decisions: [`docs/adr/`](docs/adr/)
- Work tracking: [Issues](https://github.com/aadarshjr123/brain/issues) and the [project board](https://github.com/users/aadarshjr123/projects/3)
- Contributing, including how to add or fix a concept: [`CONTRIBUTING.md`](CONTRIBUTING.md)
