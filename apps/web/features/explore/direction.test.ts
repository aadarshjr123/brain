import { describe, expect, it } from 'vitest';

import { ARROWS, pickInDirection } from './direction';

const at = (id: string, x: number, y: number) => ({ id, x, y });
const from = { x: 0, y: 0 };

describe('pickInDirection', () => {
  const nodes = [
    at('right', 100, 5),
    at('farRight', 400, 0),
    at('up', 0, -80),
    at('diag', 70, -70),
    at('left', -50, 0),
  ];

  it('picks the closest-aligned node in the arrow direction', () => {
    expect(pickInDirection(from, nodes, ARROWS.ArrowRight ?? from)?.id).toBe('right');
    expect(pickInDirection(from, nodes, ARROWS.ArrowUp ?? from)?.id).toBe('up');
    expect(pickInDirection(from, nodes, ARROWS.ArrowLeft ?? from)?.id).toBe('left');
  });

  it('returns nothing when no node lies within 60 degrees', () => {
    expect(pickInDirection(from, nodes, ARROWS.ArrowDown ?? from)).toBeUndefined();
  });

  it('ignores the node itself', () => {
    expect(pickInDirection(from, [at('self', 0, 0)], ARROWS.ArrowRight ?? from)).toBeUndefined();
  });
});
