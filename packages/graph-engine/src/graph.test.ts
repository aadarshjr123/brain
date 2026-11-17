import { describe, expect, it } from 'vitest';

import { buildGraph } from './graph.ts';

const g = buildGraph(
  [{ id: 'a' }, { id: 'b' }, { id: 'c' }],
  [
    { from: 'a', to: 'b', relation: 'drives' },
    { from: 'c', to: 'a', relation: 'feeds', weight: 2 },
  ],
);

describe('buildGraph', () => {
  it('records each relation on both ends with its direction', () => {
    expect(g.neighbours('a')).toEqual([
      { id: 'b', relation: 'drives', direction: 'out', weight: 1 },
      { id: 'c', relation: 'feeds', direction: 'in', weight: 2 },
    ]);
    expect(g.neighbours('b')).toEqual([{ id: 'a', relation: 'drives', direction: 'in', weight: 1 }]);
  });

  it('counts degree across both directions', () => {
    expect([g.degree('a'), g.degree('b'), g.degree('c')]).toEqual([2, 1, 1]);
  });

  it('reads the relation between neighbours from the first side', () => {
    expect(g.relationBetween('b', 'a')).toMatchObject({ relation: 'drives', direction: 'in' });
    expect(g.relationBetween('b', 'c')).toBeUndefined();
  });

  it('answers safely for unknown ids', () => {
    expect(g.neighbours('nope')).toEqual([]);
    expect(g.degree('nope')).toBe(0);
    expect(g.has('nope')).toBe(false);
  });

  it('skips edges to unknown nodes instead of throwing', () => {
    const partial = buildGraph([{ id: 'a' }], [{ from: 'a', to: 'ghost', relation: 'x' }]);
    expect(partial.degree('a')).toBe(0);
  });
});
