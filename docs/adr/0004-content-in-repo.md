# ADR-0004: Content lives in the repository, not a database or CMS

| | |
|---|---|
| Status | Accepted |
| Date | 2026-11-16 |
| Deciders | Aadarsh, Claude |

## Context
The facts are the product. They need review, history and sources. Users never write to them.

## Decision
Nodes, edges and notes are YAML and MDX files in `packages/content`, parsed by Velite with Zod schemas and validated by a custom graph check at build time. A content change is a pull request.

## Consequences
Every fact has a diff, a reviewer and a date. No server, no CMS cost. Non-technical contributors need the PR flow explained; a CONTRIBUTING guide covers it.

## Alternatives considered
Headless CMS: editing UI, but facts leave version control. Database: no benefit without user writes.
