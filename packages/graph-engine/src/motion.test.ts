import { describe, expect, it } from 'vitest';

import { MOTION, backOut, clamp01, easeOut } from './motion.ts';

describe('motion', () => {
  it('keeps mockup v3 timings', () => {
    expect(MOTION).toMatchObject({ popMs: 520, staggerMs: 45, edgeGrowMs: 420, hopMs: 650, anchorMs: 700 });
  });

  it('eases start at 0 and end at 1', () => {
    for (const ease of [backOut, easeOut]) {
      expect(ease(0)).toBeCloseTo(0, 10);
      expect(ease(1)).toBeCloseTo(1, 10);
    }
  });

  it('backOut overshoots before settling: the pop', () => {
    expect(Math.max(...Array.from({ length: 99 }, (_, i) => backOut((i + 1) / 100)))).toBeGreaterThan(1.05);
  });

  it('easeOut is monotonic and front-loaded', () => {
    expect(easeOut(0.5)).toBeGreaterThan(0.5);
    for (let t = 0; t < 1; t += 0.05) expect(easeOut(t + 0.05)).toBeGreaterThanOrEqual(easeOut(t));
  });

  it('clamps to the unit interval', () => {
    expect([clamp01(-1), clamp01(0.3), clamp01(2)]).toEqual([0, 0.3, 1]);
  });
});
