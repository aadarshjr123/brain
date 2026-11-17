import { describe, expect, it } from 'vitest';

import { graph } from './index.ts';

describe('compiled content', () => {
  it('keeps at least the concepts and relations ported from mockup v3 (minus two duplicates)', () => {
    expect(graph.nodes.length).toBeGreaterThanOrEqual(144);
    expect(graph.edges.length).toBeGreaterThanOrEqual(276);
  });

  it('has concepts in every domain', () => {
    const used = new Set(graph.nodes.map((n) => n.domain));
    expect(graph.domains.map((d) => d.id).filter((d) => !used.has(d))).toEqual([]);
  });

  it('meets the PRD content target: at least 150 concepts and 300 relations', () => {
    expect(graph.nodes.length).toBeGreaterThanOrEqual(150);
    expect(graph.edges.length).toBeGreaterThanOrEqual(300);
  });

  it('cites at least one https source for every concept', () => {
    for (const n of graph.nodes) expect(n.sources.length, n.id).toBeGreaterThan(0);
  });

  it('gives every concept a summary and a verified date', () => {
    for (const n of graph.nodes) {
      expect(n.summary.length, n.id).toBeGreaterThanOrEqual(20);
      expect(n.verified, n.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
