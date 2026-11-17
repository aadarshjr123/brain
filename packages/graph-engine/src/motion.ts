/**
 * Every timing and easing of the map, in one place (BRAIN-15 AC). Values are mockup v3's.
 * Change a number here and the whole product moves together.
 */
export const MOTION = {
  /** Node pop-in duration. */
  popMs: 520,
  /** Delay between siblings popping out of an unfold. */
  staggerMs: 45,
  /** Edge grow-in duration, from the older end to the newer. */
  edgeGrowMs: 420,
  /** Route: time to draw one hop. */
  hopMs: 650,
  /** Route: pulse speed on loop after the first draw, as a fraction of hopMs speed. */
  pulseLoopRate: 0.6,
  /** Unfold: how long the parent stays pinned while children burst out. */
  anchorMs: 700,
  /** Focus halo breathing period (radians per ms) and amplitude (px). */
  breatheRate: 1 / 500,
  breatheAmp: 1.5,
  /** Camera moves. */
  centerMs: 450,
  fitMs: 600,
  fitDelayMs: 500,
  zoomStepMs: 200,
  resetMs: 400,
} as const;

/** Overshoot ease for the node pop (backOut, s = 1.70158). */
export function backOut(t: number): number {
  const c = 1.70158;
  return 1 + (c + 1) * (t - 1) ** 3 + c * (t - 1) ** 2;
}

/** Cubic ease-out for edges, routes and the pulse. */
export function easeOut(t: number): number {
  return 1 - (1 - t) ** 3;
}

export const clamp01 = (t: number): number => (t < 0 ? 0 : t > 1 ? 1 : t);
