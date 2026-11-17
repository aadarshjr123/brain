import { describe, expect, it } from 'vitest';

import type { ConceptNode, ContentGraph, Edge } from './types.ts';
import { validateGraph } from './validate.ts';

const node = (id: string, domain = 'js', sources = 1): ConceptNode => ({
  id,
  label: id,
  domain,
  summary: `${id} is a concept used in tests.`,
  aliases: [],
  sources: Array.from({ length: sources }, () => ({ title: 'MDN', url: 'https://developer.mozilla.org/' })),
  verified: '2026-11-16',
});
const edge = (from: string, to: string, relation = 'touches'): Edge => ({ from, to, relation, weight: 1 });

/** A valid triangle: a → b → c → a. Each test breaks one thing. */
function fixture(patch: Partial<ContentGraph> = {}): ContentGraph {
  return {
    domains: [{ id: 'js', name: 'JavaScript', description: 'The language.' }],
    nodes: [node('a'), node('b'), node('c')],
    edges: [edge('a', 'b'), edge('b', 'c'), edge('c', 'a')],
    ...patch,
  };
}
const rules = (graph: ContentGraph, missingSources: 'error' | 'warning' = 'warning') =>
  validateGraph(graph, { missingSources }).map((f) => `${f.severity}:${f.rule}`);

describe('validateGraph', () => {
  it('passes a valid graph with no findings', () => {
    expect(validateGraph(fixture())).toEqual([]);
  });

  it('fails on duplicate concept ids', () => {
    expect(rules(fixture({ nodes: [node('a'), node('a'), node('b'), node('c')] }))).toContain(
      'error:unique-node',
    );
  });

  it('fails on duplicate domain ids', () => {
    const d = { id: 'js', name: 'JS', description: 'x' };
    expect(rules(fixture({ domains: [d, d] }))).toContain('error:unique-domain');
  });

  it('fails when a node file names an unknown domain', () => {
    expect(rules(fixture({ nodes: [node('a'), node('b'), node('c', 'nope')] }))).toContain(
      'error:known-domain',
    );
  });

  it('fails on edges to unknown concepts', () => {
    const findings = validateGraph(fixture({ edges: [...fixture().edges, edge('a', 'ghost')] }));
    expect(findings.find((f) => f.rule === 'known-endpoint')?.message).toContain('"ghost"');
  });

  it('fails on self-loops', () => {
    expect(rules(fixture({ edges: [...fixture().edges, edge('a', 'a')] }))).toContain('error:no-self-loop');
  });

  it('fails when two edges link the same pair, in either direction', () => {
    expect(rules(fixture({ edges: [...fixture().edges, edge('b', 'a', 'restates')] }))).toContain(
      'error:unique-edge',
    );
  });

  it('fails on relations longer than 40 characters', () => {
    expect(
      rules(fixture({ edges: [edge('a', 'b', 'x'.repeat(41)), edge('b', 'c'), edge('c', 'a')] })),
    ).toContain('error:relation-text');
  });

  it('fails on an isolated concept', () => {
    expect(rules(fixture({ nodes: [...fixture().nodes, node('lonely')] }))).toContain('error:connected');
  });

  it('fails when the graph splits into two islands', () => {
    const graph = fixture({
      nodes: [...fixture().nodes, node('x'), node('y')],
      edges: [...fixture().edges, edge('x', 'y')],
    });
    expect(validateGraph(graph).find((f) => f.rule === 'connected')?.message).toContain('x, y');
  });

  it('warns on missing sources by default and fails when strict', () => {
    const graph = fixture({ nodes: [node('a', 'js', 0), node('b'), node('c')] });
    expect(rules(graph)).toEqual(['warning:has-source']);
    expect(rules(graph, 'error')).toEqual(['error:has-source']);
  });
});
