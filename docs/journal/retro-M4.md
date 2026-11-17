# Retro — Milestone M4 Launch (2026-11-17)

Status: tickets in review as stacked PRs #67, #68, #69 and the BRAIN-33 docs PR; the release is tagged when the
stack merges (`docs/runbooks/release.md`).

## What we shipped

Quality gates in CI: Playwright e2e, axe in both themes, a JavaScript budget and a frame-timing check (BRAIN-30);
security headers with a hardened CSP and Trusted Types (BRAIN-31); a source for every concept, eight new concepts
and cross-links (BRAIN-32); launch docs, changelog, release notes and retros (BRAIN-33).

## What went well

- **Every gate caught something on its first run.** The budget found `/explore` at 279 KB against 250. axe found
  four contrast and labelling failures in the light theme. The phone test found a card running off screen. The CSP
  test found Turbopack's chunk loader blocked by Trusted Types.
- Fixes were measured: `/explore` went to 219 KB and every text page to 165 KB by moving Zod and IndexedDB off the
  first load. Frame timing during "unfold everything" is a steady 60 Hz.
- The link checker found one dead source and five moved ones before any reader did.

## What did not

- The BRAIN-31 acceptance criteria could not be met without giving up static pages. We found out by testing, wrote
  ADR-0011, and flagged the deviation on the ticket instead of shipping a weaker header quietly.
- I first wrote a content test that asserted 290 relations because the data had 296; the PRD says 300. Fixed by
  adding relations, not by lowering the bar.
- GitHub's GraphQL rate limit stopped board updates for a few minutes; the board script listed the whole board on
  every move. Now it looks up one item.

## What we learned

- Proving a gate by what it catches is the only proof that counts (the M0 lesson, again, at a larger scale).
- Read a framework's security guidance, then verify it in a browser (#70).
- Never tune a test to the data; tune the data to the requirement, or change the requirement in writing.

## Metrics vs. targets (PRD §5 and system design §1)

| Metric                              | Target             | Actual                                                    |
| ----------------------------------- | ------------------ | --------------------------------------------------------- |
| First-load JS on `/explore`         | ≤ 250 KB gzipped   | 223 KB                                                    |
| Frames during unfold                | 60 fps             | p95 16.8 ms (local Chromium), checked in CI               |
| Concepts / relations / with sources | ≥ 150 / 300 / all  | 152 / 301 / all                                           |
| Pairs within 7 hops                 | ≥ 95%              | 99.6%                                                     |
| Accessibility                       | WCAG 2.2 AA        | zero serious or critical axe findings, 6 views × 2 themes |
| LCP, INP, CLS at p75 on mobile      | 2.5 s, 200 ms, 0.1 | not measured yet: needs production traffic                |

## Actions

| Action                                                           | Owner   | Ticket            |
| ---------------------------------------------------------------- | ------- | ----------------- |
| Link Vercel, set Sentry, enable Speed Insights                   | Aadarsh | BRAIN-5, 6        |
| Decide repo visibility; apply the ruleset with `e2e` required    | Aadarsh | BRAIN-17          |
| Merge the stack bottom-up; tag v1.0.0 with the release runbook   | Aadarsh | BRAIN-33          |
| Check Core Web Vitals after a week of traffic; record in journal | both    | new, after launch |
| Choose a licence for code and content before announcing          | Aadarsh | new               |
