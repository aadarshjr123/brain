# ADR-0009: Compile content with a small Zod + YAML script, not Velite

|            |                                         |
| ---------- | --------------------------------------- |
| Status     | Accepted                                |
| Date       | 2026-11-17                              |
| Deciders   | Aadarsh, Claude                         |
| Supersedes | The "parsed by Velite" part of ADR-0004 |

## Context

ADR-0004 put content in the repo and named Velite as the parser. Starting BRAIN-9 showed three mismatches:

1. Velite is built around document collections (posts, pages) inside one app. Our content is a graph: three
   collections whose correctness depends on each other (edges must point at nodes, nodes at domains). The
   cross-collection checks are the hard part, and Velite would not do them; we would write them anyway.
2. The graph is consumed by a framework-free package (`@brain/graph-engine`) and its tests, not only by the
   Next.js app. Velite's output and config live with the app.
3. The MDX notes that motivated Velite are not in v1 scope: concept pages render the summary, relations and
   sources. Long-form notes can return later as plain Markdown fields.

## Decision

`@brain/content` owns a ~150 line compiler:

- `data/*.yaml` is parsed with `yaml`, shaped by Zod schemas in `src/schema.ts`.
- `src/validate.ts` runs the graph rules (BRAIN-11).
- `src/cli/compile.ts` writes `generated/graph.json`. It runs with Node's built-in TypeScript type stripping, so
  there is no build tool. The output is git-ignored and rebuilt by Turborepo before anything that imports it.
- The package exposes three entry points: `@brain/content` (types and data, no Zod, safe for the client),
  `@brain/content/schema` and `@brain/content/validate` (build and test time only).

## Consequences

- Fewer dependencies and one place for every content rule. Error messages are ours, with file and path.
- Typecheck, lint and test of dependants now need the content build first. Turborepo handles the order, and the
  content build takes well under a second.
- If long-form MDX notes come back, we revisit: Velite or `@next/mdx` for notes only, keeping this compiler for the graph.

## Alternatives considered

- **Velite as planned.** Rejected for the reasons above, not because it is a bad tool.
- **Content as TypeScript modules.** Type-safe for free, but YAML is friendlier for content-only contributors and
  diffs read better in review.
- **Commit the generated JSON.** No build-order coupling, but two sources of truth and a drift check in CI.
