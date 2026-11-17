# Retro — Milestone M3 Route + reference (2026-11-17)

Status: tickets in review as stacked PRs #61 to #66.

## What we shipped

Route mode with narrated hops and shareable routes (BRAIN-24); a static page for every concept (BRAIN-25); a
filterable, printable cheatsheet (BRAIN-26); share images, sitemap, robots, manifest and icons (BRAIN-27); an offline
shell (BRAIN-28); a home page with example routes (BRAIN-29).

## What went well

- The route flow reused BRAIN-12's BFS and BRAIN-14's renderer unchanged; the hop-sync design from the system design
  (renderer reports hop changes, card subscribes) worked first time.
- Typed routes caught a link to a page that did not exist yet, at typecheck, before any user could hit it.
- Concept pages render routes as text, so the map's core idea is available without the canvas or JavaScript.

## What did not

- Serwist, planned for offline, is a webpack plugin and we build with Turbopack (ADR-0010). The plan named a tool
  without checking it fit the toolchain we had already chosen.
- My first home-page example route was a single hop, which showed nothing and printed "1 hops".

## What we learned

- Check that a planned library fits the build before writing the plan around it.
- Content examples on marketing pages need tests too, or content changes quietly break them.

## Metrics vs. targets

| Metric                             | Target                | Actual                           |
| ---------------------------------- | --------------------- | -------------------------------- |
| Concept pages statically generated | all                   | all (152), plus 152 share images |
| Offline after first visit          | map and visited pages | yes, e2e-tested                  |
| Cheatsheet printable               | one column            | yes, 9 pages for 144 concepts    |

## Actions

| Action                                              | Owner  | Ticket   |
| --------------------------------------------------- | ------ | -------- |
| Gate everything shipped so far with e2e and budgets | Claude | BRAIN-30 |
