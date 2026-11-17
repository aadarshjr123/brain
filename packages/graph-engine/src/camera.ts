import type { Transform } from './renderer.ts';

/** Zoom limits and steps from mockup v3. */
export const CAMERA = {
  minZoom: 0.25,
  maxZoom: 3,
  zoomStep: 1.4,
  fitPadding: 120,
  fitMaxZoom: 1.6,
} as const;

export interface Point {
  x: number;
  y: number;
}

/** Keep the zoom, move so that `point` sits in the middle of the viewport. */
export function centerOn(point: Point, size: { width: number; height: number }, k: number): Transform {
  return { x: size.width / 2 - point.x * k, y: size.height / 2 - point.y * k, k };
}

/** Zoom and move so every point fits with padding; never zooms past fitMaxZoom (one node should not fill the screen). */
export function fitBounds(
  points: readonly Point[],
  size: { width: number; height: number },
): Transform | null {
  if (points.length === 0) return null;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const p of points) {
    x0 = Math.min(x0, p.x);
    y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x);
    y1 = Math.max(y1, p.y);
  }
  const pad = CAMERA.fitPadding * 2;
  const k = Math.max(
    CAMERA.minZoom,
    Math.min(CAMERA.fitMaxZoom, Math.min(size.width / (x1 - x0 + pad), size.height / (y1 - y0 + pad))),
  );
  return centerOn({ x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, size, k);
}
