import { graph } from '@brain/content';
import { buildGraph } from '@brain/graph-engine';
import { describe, expect, it } from 'vitest';

import { createSearchIndex } from './search';

const g = buildGraph(graph.nodes, graph.edges);
const index = createSearchIndex(graph.nodes, (id) => g.degree(id));
const ids = (q: string) => index.query(q).map((n) => n.id);

describe('search', () => {
  it('ranks a label prefix first', () => {
    expect(ids('event')[0]).toBe('event_loop');
  });

  it('finds by id words and by summary', () => {
    expect(ids('microtask')).toContain('microtask_queue');
    expect(ids('rasterise').length).toBeGreaterThan(0);
  });

  it('is case-insensitive and trims', () => {
    expect(ids('  CORS ')).toContain('cors');
  });

  it('returns nothing for an empty query and caps results', () => {
    expect(index.query('   ')).toEqual([]);
    expect(index.query('e').length).toBeLessThanOrEqual(8);
  });

  it('breaks ties by how connected a concept is', () => {
    const prefixMatches = graph.nodes.filter((n) => n.label.toLowerCase().startsWith('co'));
    const mostConnected = Math.max(...prefixMatches.map((n) => g.degree(n.id)));
    expect(g.degree(ids('co')[0] ?? '')).toBe(mostConnected);
  });

  /** Fewest characters of the concept's own label or id that make it the first result. */
  const keystrokes = (id: string, label: string) => {
    const text = `${label} ${id.replaceAll('_', ' ')}`.toLowerCase();
    for (let len = 1; len <= 4; len++) {
      for (let i = 0; i + len <= text.length; i++) {
        const q = text.slice(i, i + len);
        if (q.trim().length === len && index.query(q)[0]?.id === id) return len;
      }
    }
    return Infinity;
  };

  it('PRD reference speed: the 50 most connected concepts are first after 2 keystrokes (≥ 95%), all within 3', () => {
    const top = [...graph.nodes].sort((a, b) => g.degree(b.id) - g.degree(a.id)).slice(0, 50);
    const counts = top.map((n) => keystrokes(n.id, n.label));
    // 2026-11-17: 49 of 50 in two; "bundler" needs three.
    expect(counts.filter((k) => k <= 2).length).toBeGreaterThanOrEqual(48);
    expect(Math.max(...counts)).toBeLessThanOrEqual(3);
  });
});
