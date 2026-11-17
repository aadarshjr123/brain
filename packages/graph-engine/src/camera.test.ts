import { describe, expect, it } from 'vitest';

import { CAMERA, centerOn, fitBounds } from './camera.ts';

const size = { width: 1000, height: 600 };

describe('camera', () => {
  it('centers a point at the current zoom', () => {
    const t = centerOn({ x: 100, y: -50 }, size, 2);
    expect(t).toEqual({ x: 500 - 200, y: 300 + 100, k: 2 });
  });

  it('fits a spread of points inside the viewport with padding', () => {
    const t = fitBounds(
      [
        { x: -500, y: -200 },
        { x: 500, y: 200 },
      ],
      size,
    );
    expect(t).not.toBeNull();
    const k = t?.k ?? 0;
    // both corners land inside the viewport
    for (const p of [
      { x: -500, y: -200 },
      { x: 500, y: 200 },
    ]) {
      const sx = p.x * k + (t?.x ?? 0);
      const sy = p.y * k + (t?.y ?? 0);
      expect(sx).toBeGreaterThanOrEqual(0);
      expect(sx).toBeLessThanOrEqual(size.width);
      expect(sy).toBeGreaterThanOrEqual(0);
      expect(sy).toBeLessThanOrEqual(size.height);
    }
  });

  it('does not zoom past the fit maximum for a single node', () => {
    expect(fitBounds([{ x: 0, y: 0 }], size)?.k).toBe(CAMERA.fitMaxZoom);
  });

  it('does not zoom out past the minimum for a huge spread', () => {
    expect(
      fitBounds(
        [
          { x: -1e5, y: 0 },
          { x: 1e5, y: 0 },
        ],
        size,
      )?.k,
    ).toBe(CAMERA.minZoom);
  });

  it('returns null for nothing to fit', () => {
    expect(fitBounds([], size)).toBeNull();
  });
});
