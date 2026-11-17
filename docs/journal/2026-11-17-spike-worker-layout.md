# Spike BRAIN-16: does the force layout need a Web Worker?

Date: 2026-11-17 · Time box: 4h · Outcome: **not adopted now**; trigger recorded below.

## Question

System design §6 says the simulation moves to a Web Worker past ~300 nodes. Is that true for our layout and
forces, and what would it cost?

## Method

`pnpm --filter @brain/graph-engine bench` (`packages/graph-engine/bench/layout.bench.ts`):

- Runs our real `Layout` with mockup forces while hot (alpha = 1, the most expensive phase), 120 ticks after warm-up.
- Graphs: the real content, and synthetic graphs grown by preferential attachment to the same average degree (~3.8).
- Transfer: a `Float32Array` of x,y positions posted across a `MessageChannel` as a transferable, the exact handoff a
  worker would do each frame.
- Machine: Apple Silicon laptop, Node 25 (V8, the same engine as Chrome). A 2020 mid-range laptop is roughly 2–3×
  slower; numbers below should be read with that factor.

## Results

| Graph        | Nodes | Edges | Tick p50 | Tick p95 |
| ------------ | ----: | ----: | -------: | -------: |
| Real content |   144 |   276 |  0.32 ms |  0.39 ms |
| Synthetic    |   500 |   950 |  1.37 ms |  1.78 ms |
| Synthetic    |  1500 |  2848 |  5.72 ms |  6.30 ms |

Transfer of 500 or 1500 positions: ~0.003 ms. The handoff is free; the cost of a worker is complexity, not copying.

## Reading

- A frame at 60 Hz is 16.7 ms. Today the layout takes ~2% of it. At 500 nodes, ~10%. At 1500 nodes, ~35–40%
  here and possibly the whole budget on a slow laptop, before drawing.
- The layout only ticks while it moves: during an unfold or a drag, for a couple of seconds. A settled map ticks
  zero times (BRAIN-14's demand-driven loop). So the risk is jank during animation, not idle CPU.
- Content target is ~500 nodes over two years (system design §1). We are at 144.

## Decision

Do not add a worker now. It would add a message protocol, a second bundle and harder debugging for a ~0.3 ms win.

**Trigger to revisit**, whichever comes first:

1. Content passes **400 nodes**; or
2. The perf check (BRAIN-30) measures frame **p95 > 12 ms** during unfold on CI's Chromium.

When triggered: the Layout API already fits a worker (`step()` per frame, positions are plain numbers), so the
change is a `WorkerLayout` with the same surface that posts a `Float32Array` back each tick. Record it as an ADR then.

## Not measured

Draw cost in a real browser canvas. Node has no canvas. BRAIN-30 adds a frame-timing check in Chromium through
Playwright; its numbers get appended here.

## Update from BRAIN-30: draw cost in a real browser

The e2e suite measures frames with `requestAnimationFrame` while unfolding the whole map (144 nodes, all edges
growing, labels drawing) in Chromium:

| Frame time during "unfold everything" | p50     | p95     |
| ------------------------------------- | ------- | ------- |
| Local, Apple Silicon, Chromium 158    | 16.7 ms | 16.8 ms |

That is a steady 60 Hz with layout and drawing together. The decision above stands. The check runs in CI on
every PR (it fails above a p95 of 50 ms, loose because CI runners are shared), so a regression shows up there first.
