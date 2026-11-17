# ADR-0005: No accounts; personal progress stays on the device

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-16      |
| Deciders | Aadarsh, Claude |

## Context

Brain is a public study map and reference. Accounts would add auth, a database, privacy obligations and sign-up friction. The only user data is what you explored and answered.

## Decision

No login in v1. Progress, bookmarks and personal notes are stored in IndexedDB via Dexie, with export and import as a JSON file. TanStack Query is not used because nothing comes from a server. Revisit when a feature genuinely needs a server.

## Consequences

Zero backend cost, zero privacy surface, fastest possible first visit. Progress does not follow you across devices unless you export it. A future sync feature can replay the same append-only event log.

## Alternatives considered

Supabase auth + Postgres sync: considered and planned at one point, rejected for v1 as cost without value. Anonymous server-side progress keyed by a random id: still a server and still privacy surface.
