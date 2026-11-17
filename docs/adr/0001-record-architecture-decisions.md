# ADR-0001: Record architecture decisions

|          |                 |
| -------- | --------------- |
| Status   | Accepted        |
| Date     | 2026-11-16      |
| Deciders | Aadarsh, Claude |

## Context

We want every significant technical decision to be visible, dated and reviewable, the way a product team keeps them.

## Decision

We keep Architecture Decision Records in `docs/adr/`, numbered, one per decision, using the template in `docs/templates/adr.md`. An accepted ADR is never edited; it is superseded by a new one that links back.

## Consequences

Decisions have a paper trail. New contributors read the ADR folder first. Changing a decision costs a short document, which is the point.

## Alternatives considered

Decisions in chat or commit messages only. Rejected: they get lost.
