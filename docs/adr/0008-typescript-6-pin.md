# ADR-0008: Pin TypeScript 6.0, not 7.x

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-17      |
| Deciders | Aadarsh, Claude |

## Context

TypeScript 7 (the native port) is `latest` on npm. Our lint stack depends on typescript-eslint, whose current
release declares `typescript >=4.8.4 <6.1.0`. Running outside a peer range means type-aware lint rules can
crash or silently misbehave, and those rules are part of our review gate (BRAIN-3).

## Decision

Pin `typescript@6.0.3` exactly, in the root and in every package. Shared compiler options live in
`@brain/config/tsconfig/*`. Revisit when typescript-eslint supports 7.x; the upgrade is one ticket.

## Consequences

Type-aware linting is supported and predictable. We miss TypeScript 7's faster type checking for now, which
matters little at our size. Renovate or a manual check should flag when the peer range widens.

## Alternatives considered

- TypeScript 7 with type-aware lint rules disabled: loses the most valuable lint rules.
- TypeScript 7 with `--force` peer installs: unsupported combination, failures would be hard to diagnose.
