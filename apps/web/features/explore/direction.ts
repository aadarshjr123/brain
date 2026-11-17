export interface Point {
  x: number;
  y: number;
}

/**
 * Keyboard navigation on the map: from `from`, pick the candidate that best matches an arrow direction.
 * Candidates must lie within ±60° of the direction; among them, prefer small angle, then short distance.
 */
export function pickInDirection<T extends Point>(
  from: Point,
  candidates: readonly T[],
  dir: Point,
): T | undefined {
  const dirLen = Math.hypot(dir.x, dir.y) || 1;
  let best: T | undefined;
  let bestScore = Infinity;
  for (const c of candidates) {
    const dx = c.x - from.x;
    const dy = c.y - from.y;
    const dist = Math.hypot(dx, dy);
    if (dist === 0) continue;
    const cos = (dx * dir.x + dy * dir.y) / (dist * dirLen);
    if (cos < 0.5) continue; // outside ±60°
    const score = (1 - cos) * 4 + dist / 1000;
    if (score < bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return best;
}

export const ARROWS: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
};
