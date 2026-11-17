import { graph as content } from '@brain/content';
import { describe, expect, it } from 'vitest';

import { buildGraph } from './graph.ts';
import { distancesFrom, shortestPath } from './path.ts';

describe('shortestPath on fixtures', () => {
  // a - b - c - d, and a - e - d: two routes from a to d, the second one shorter.
  const g = buildGraph(
    ['a', 'b', 'c', 'd', 'e', 'island'].map((id) => ({ id })),
    [
      { from: 'a', to: 'b', relation: 'r' },
      { from: 'b', to: 'c', relation: 'r' },
      { from: 'c', to: 'd', relation: 'r' },
      { from: 'a', to: 'e', relation: 'r' },
      { from: 'd', to: 'e', relation: 'r' }, // points "backwards": direction must not matter
    ],
  );

  it('finds the fewest hops, ignoring edge direction', () => {
    expect(shortestPath(g, 'a', 'd')).toEqual(['a', 'e', 'd']);
  });

  it('returns the single node when start equals end', () => {
    expect(shortestPath(g, 'b', 'b')).toEqual(['b']);
  });

  it('returns null when unreachable or unknown', () => {
    expect(shortestPath(g, 'a', 'island')).toBeNull();
    expect(shortestPath(g, 'a', 'ghost')).toBeNull();
  });

  it('is symmetric in length', () => {
    expect(shortestPath(g, 'd', 'a')).toHaveLength(3);
  });
});

describe('routes over the real content', () => {
  const g = buildGraph(content.nodes, content.edges);

  it('finds known chains from the mockup', () => {
    expect(shortestPath(g, 'microtask_queue', 'event_loop')).toEqual(['microtask_queue', 'event_loop']);
    const route = shortestPath(g, 'set_state', 'gpu_process');
    expect(route?.[0]).toBe('set_state');
    expect(route?.at(-1)).toBe('gpu_process');
    // every hop is a real relation
    route?.slice(1).forEach((id, i) => {
      expect(g.relationBetween(route[i] ?? '', id), `${route[i] ?? ''} → ${id}`).toBeDefined();
    });
  });

  it('meets the PRD: at least 95% of concept pairs are within 7 hops, and every pair is connected', () => {
    const ids = [...g.nodes.keys()];
    let pairs = 0;
    let within = 0;
    for (const id of ids) {
      const d = distancesFrom(g, id);
      expect(d.size, `${id} reaches everyone`).toBe(ids.length);
      for (const [other, hops] of d) {
        if (other === id) continue;
        pairs++;
        if (hops <= 7) within++;
      }
    }
    // 2026-11-17: 98.4% within 7 hops; the longest route is 11 (prototype → sse).
    expect(within / pairs).toBeGreaterThanOrEqual(0.95);
  });
});
