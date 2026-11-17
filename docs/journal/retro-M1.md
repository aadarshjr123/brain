# Retro — Milestone M1 Engine + content (2026-11-17)

Status: tickets in review as stacked PRs #30 to #39. The milestone closes when they merge.

## What we shipped

- `@brain/content`: Zod schemas, a YAML compiler with readable errors, and a graph validator with nine rules.
  All 144 concepts and 276 relations ported from mockup v3 (BRAIN-9, 10, 11).
- `@brain/graph-engine`: graph model and BFS routes (BRAIN-12), force layout with ring unfold (BRAIN-13), the
  canvas renderer ported from the mockup (BRAIN-14), motion constants and camera math (BRAIN-15).
- Worker spike with measured numbers and a recorded "not now" (BRAIN-16).
- 72 unit tests across the two packages.

## What went well

- The validator paid for itself on its first run: two relations in the mockup restated another in reverse.
- Testing the PRD's route target over all 20,592 pairs instead of a sample: an exact answer (98.4% within 7 hops).
- Keeping the engine framework-free made every piece testable in Node without a browser.
- Letting the renderer drive the simulation (one loop, demand-driven) simplified both and made tests deterministic.

## What did not

- CI failed on BRAIN-9 because an empty folder existed only on my machine. I had stacked three PRs on it before
  reading the CI result.
- My first fix attempt was to rebase and force-push the stack. That was blocked, correctly.
- I wrote a "longest route ≤ 10 hops" assertion that no requirement asked for; the content has 11.

## What we learned

- Code that reads the filesystem handles absence; CI is the clean-checkout test (learning #34).
- Fix low in a stack by merging upward, never by rewriting pushed branches (learning #34).
- Assertions encode requirements. If the number is not in the PRD or a ticket, measure and record it instead.
- Node's built-in type stripping is enough for build scripts if the code sticks to erasable syntax
  (`erasableSyntaxOnly` makes `tsc` enforce it).

## Metrics vs. targets

| Metric                        | Target               | Actual                        |
| ----------------------------- | -------------------- | ----------------------------- |
| Concept pairs within 7 hops   | ≥ 95%                | 98.4%                         |
| Content validated in CI       | yes                  | yes, nine rules               |
| Layout tick at 500 nodes      | fits a 16.7 ms frame | 1.4 ms p50 (Apple Silicon)    |
| Engine and content unit tests | logic covered        | 72 tests                      |
| Concepts with sources         | warning in M1        | 0 of 144: tracked in BRAIN-32 |

## Actions

| Action                                                       | Owner  | Ticket   |
| ------------------------------------------------------------ | ------ | -------- |
| Add sources to every concept; make missing sources an error  | Claude | BRAIN-32 |
| Add cross-links so the JS engine cluster reaches the network | Claude | BRAIN-32 |
| Measure draw cost in a real browser and append to the spike  | Claude | BRAIN-30 |
| Read CI before stacking on a PR                              | both   | process  |
