# Retro — Milestone M2 Explore (2026-11-17)

Status: tickets in review as stacked PRs #56 to #60.

## What we shipped

The v3 mockup rebuilt as the real app: the explore stage with unfold, fold, drag, pan and zoom (BRAIN-19); search,
legend, trail, detail card, controls and toasts (BRAIN-20); links that restore the map (BRAIN-21); local progress,
bookmarks and export with Redux and IndexedDB (BRAIN-22); theme control, keyboard navigation of the canvas and
screen-reader announcements (BRAIN-23).

## What went well

- The ADR-0006 split held up in practice. Zustand feeds the renderer every frame, Redux holds replayable domain state,
  and a ten-line bridge component connects them without either store importing the other.
- Checking every ticket in a real browser, both themes, caught three things unit tests could not: a top bar laid out
  in the wrong order, no labels after the first fit, and a translucent popover that was hard to read.
- Measuring the PRD's "two keystrokes" target exactly (49 of the top 50 concepts) instead of asserting a hope.

## What did not

- Mockup v3's hub-label rule (degree > 10) matched no concept, so mid-zoom views had no labels. We ported a bug
  faithfully before noticing.
- A catch-all error handler reported a missing IndexedDB index as "storage unavailable" (learning #71).
- My browser-check script split steps on every colon and clicked the wrong button; for a moment it looked like an app bug.

## What we learned

- "Port the mockup exactly" needs a check that the mockup's numbers still fit the real data.
- Fallbacks classify errors before degrading (#71).
- Debug the harness before the app: call the code directly and compare.

## Metrics vs. targets

| Metric                                            | Target         | Actual                       |
| ------------------------------------------------- | -------------- | ---------------------------- |
| Search to card for the 50 most connected concepts | 2 keys + Enter | 49 of 50 (one needs 3)       |
| React re-renders per animation frame              | 0              | 0 (renderer reads the store) |
| Progress survives reload                          | yes            | yes, e2e-tested              |

## Actions

| Action                                         | Owner  | Ticket   |
| ---------------------------------------------- | ------ | -------- |
| Measure first-load JS now that the map is real | Claude | BRAIN-30 |
| Run axe on the map in both themes              | Claude | BRAIN-30 |
