import { describe, expect, it } from 'vitest';

import { graph } from './index.ts';

describe('compiled content', () => {
  it('keeps at least the concepts and relations ported from mockup v3', () => {
    expect(graph.nodes.length).toBeGreaterThanOrEqual(144);
    expect(graph.edges.length).toBeGreaterThanOrEqual(278);
  });

  it('has concepts in every domain', () => {
    const used = new Set(graph.nodes.map((n) => n.domain));
    expect(graph.domains.map((d) => d.id).filter((d) => !used.has(d))).toEqual([]);
  });

  it('gives every concept a summary and a verified date', () => {
    for (const n of graph.nodes) {
      expect(n.summary.length, n.id).toBeGreaterThanOrEqual(20);
      expect(n.verified, n.id).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    }
  });
});
