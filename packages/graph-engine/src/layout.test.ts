import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { seededRandom } from './geometry.ts';
import { buildGraph } from './graph.ts';
import { FORCES, Layout } from './layout.ts';
import { MOTION } from './motion.ts';

// hub with five spokes, plus one spoke-to-spoke edge
const graph = buildGraph(
  ['hub', 's1', 's2', 's3', 's4', 's5', 'far'].map((id) => ({ id })),
  [
    { from: 'hub', to: 's1', relation: 'r' },
    { from: 'hub', to: 's2', relation: 'r' },
    { from: 'hub', to: 's3', relation: 'r' },
    { from: 'hub', to: 's4', relation: 'r' },
    { from: 'hub', to: 's5', relation: 'r' },
    { from: 's1', to: 's2', relation: 'r' },
    { from: 's5', to: 'far', relation: 'r' },
  ],
);

let clock = 1000;
const make = (seed = 1, reducedMotion = false) =>
  new Layout(graph, { random: seededRandom(seed), now: () => clock, reducedMotion });

beforeEach(() => {
  clock = 1000;
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('Layout', () => {
  it('places unfolded children on a ring around the anchor, staggered in time', () => {
    const layout = make();
    layout.addLoose(['hub']);
    const hub = layout.get('hub');
    layout.addAround(['s1', 's2', 's3'], 'hub');

    const ring = FORCES.ringRadius(3);
    for (const [i, id] of ['s1', 's2', 's3'].entries()) {
      const n = layout.get(id);
      expect(Math.hypot((n?.x ?? 0) - (hub?.x ?? 0), (n?.y ?? 0) - (hub?.y ?? 0))).toBeCloseTo(ring, 6);
      expect(n?.born).toBe(clock + i * MOTION.staggerMs);
    }
  });

  it('pins the anchor during the burst and releases it after anchorMs', () => {
    const layout = make();
    layout.addLoose(['hub']);
    layout.addAround(['s1'], 'hub');
    expect(layout.get('hub')?.fx).toBe(layout.get('hub')?.x);
    vi.advanceTimersByTime(MOTION.anchorMs);
    expect(layout.get('hub')?.fx).toBeNull();
  });

  it('builds links only between visible nodes and stamps when they start growing', () => {
    const layout = make();
    layout.addLoose(['hub', 's1']);
    expect(layout.links().map((l) => l.key)).toEqual(['hub|s1']);
    clock = 2000;
    layout.addAround(['s2'], 'hub');
    const keys = layout.links().map((l) => l.key);
    expect(keys).toEqual(['hub|s1', 'hub|s2', 's1|s2']);
    expect(layout.links().find((l) => l.key === 'hub|s1')?.born).toBe(1000);
    expect(layout.links().find((l) => l.key === 'hub|s2')?.born).toBe(2000);
  });

  it('counts hidden neighbours for the badge', () => {
    const layout = make();
    layout.addLoose(['hub', 's1']);
    expect(layout.hiddenNeighbours('hub')).toEqual(['s2', 's3', 's4', 's5']);
  });

  it('folds only neighbours that would dangle, and never protected ones', () => {
    const layout = make();
    layout.addLoose(['hub']);
    layout.addAround(['s1', 's2', 's3', 's5'], 'hub');
    layout.reveal('far', 's5');
    // s1 and s2 hold each other; s5 holds far; s3 dangles; s3 is protected in the second call.
    expect(layout.foldable('hub', new Set())).toEqual(['s3']);
    expect(layout.foldable('hub', new Set(['s3']))).toEqual([]);
  });

  it('removes nodes with their links', () => {
    const layout = make();
    layout.addLoose(['hub', 's1', 's2']);
    layout.remove(['s1']);
    expect([...layout.visible]).toEqual(['hub', 's2']);
    expect(layout.links().map((l) => l.key)).toEqual(['hub|s2']);
  });

  it('is deterministic for a seed', () => {
    const run = (seed: number) => {
      const layout = make(seed);
      layout.addLoose(['hub']);
      layout.addAround(['s1', 's2', 's3', 's4', 's5'], 'hub');
      for (let i = 0; i < 50; i++) layout.step();
      return layout.nodes().map((n) => [Math.round(n.x * 1000), Math.round(n.y * 1000)]);
    };
    expect(run(7)).toEqual(run(7));
    expect(run(7)).not.toEqual(run(8));
  });

  it('cools down and stops stepping', () => {
    const layout = make();
    layout.addLoose(['hub', 's1', 's2']);
    let ticks = 0;
    while (layout.step()) ticks++;
    expect(ticks).toBeGreaterThan(50);
    expect(layout.active).toBe(false);
  });

  it('settles at once under reduced motion', () => {
    const layout = make(1, true);
    layout.addLoose(['hub', 's1', 's2']);
    expect(layout.active).toBe(false);
    expect(layout.step()).toBe(false);
  });

  it('keeps a dragged node under the pointer and warms the simulation', () => {
    const layout = make();
    layout.addLoose(['hub', 's1']);
    while (layout.step());
    layout.dragStart('s1');
    layout.dragTo('s1', 300, -200);
    layout.step();
    expect([layout.get('s1')?.x, layout.get('s1')?.y]).toEqual([300, -200]);
    expect(layout.active).toBe(true);
    layout.dragEnd('s1');
    expect(layout.get('s1')?.fx).toBeNull();
  });

  it('finds the nearest node within a radius', () => {
    const layout = make();
    layout.addLoose(['hub']);
    const hub = layout.get('hub');
    expect(layout.find((hub?.x ?? 0) + 3, hub?.y ?? 0, 10)?.id).toBe('hub');
    expect(layout.find((hub?.x ?? 0) + 50, hub?.y ?? 0, 10)).toBeUndefined();
  });
});
