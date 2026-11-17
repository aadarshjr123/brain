import type { ContentGraph } from './types.ts';

export type Severity = 'error' | 'warning';

export interface Finding {
  rule: string;
  severity: Severity;
  message: string;
}

export interface ValidateOptions {
  /** Missing sources warn during M1 to M3 and become an error in M4 (BRAIN-11 AC). */
  missingSources: Severity;
}

export const RELATION_MAX = 40;

/**
 * Graph rules that need the whole graph to judge. Pure: no I/O, so it is easy to test with fixtures.
 * Shape rules (types, lengths, id format) are already enforced by the Zod schemas in schema.ts.
 */
export function validateGraph(
  { domains, nodes, edges }: ContentGraph,
  options: ValidateOptions = { missingSources: 'warning' },
): Finding[] {
  const findings: Finding[] = [];
  const add = (rule: string, severity: Severity, message: string) =>
    findings.push({ rule, severity, message });

  // Unique ids.
  const dupes = <T>(items: T[], key: (t: T) => string) => {
    const seen = new Set<string>();
    const out = new Set<string>();
    for (const item of items) {
      const k = key(item);
      if (seen.has(k)) out.add(k);
      seen.add(k);
    }
    return [...out];
  };
  for (const id of dupes(domains, (d) => d.id))
    add('unique-domain', 'error', `domain "${id}" is defined twice`);
  for (const id of dupes(nodes, (n) => n.id)) add('unique-node', 'error', `concept "${id}" is defined twice`);

  // Every node file maps to a declared domain.
  const domainIds = new Set(domains.map((d) => d.id));
  for (const n of nodes) {
    if (!domainIds.has(n.domain)) {
      add(
        'known-domain',
        'error',
        `concept "${n.id}" is in nodes/${n.domain}.yaml but "${n.domain}" is not in domains.yaml`,
      );
    }
  }

  // Edges: known endpoints, no self-loops, no duplicates in either direction, short relations.
  const nodeIds = new Set(nodes.map((n) => n.id));
  const pairs = new Set<string>();
  for (const { from, to, relation } of edges) {
    const label = `[${from}, ${to}, ${relation}]`;
    for (const end of [from, to]) {
      if (!nodeIds.has(end))
        add('known-endpoint', 'error', `edge ${label} points at unknown concept "${end}"`);
    }
    if (from === to) add('no-self-loop', 'error', `edge ${label} connects a concept to itself`);
    const pair = [from, to].sort().join('|');
    if (pairs.has(pair))
      add('unique-edge', 'error', `edge ${label} repeats a relation between the same two concepts`);
    pairs.add(pair);
    if (relation.trim().length === 0) add('relation-text', 'error', `edge ${label} has an empty relation`);
    if (relation.length > RELATION_MAX) {
      add(
        'relation-text',
        'error',
        `edge ${label} relation is ${String(relation.length)} characters (max ${String(RELATION_MAX)})`,
      );
    }
  }

  // Connectivity: no isolated concept, and one component, so every route has an answer.
  const adjacency = new Map<string, string[]>([...nodeIds].map((id) => [id, []]));
  for (const { from, to } of edges) {
    if (from === to || !nodeIds.has(from) || !nodeIds.has(to)) continue;
    adjacency.get(from)?.push(to);
    adjacency.get(to)?.push(from);
  }
  for (const [id, next] of adjacency) {
    if (next.length === 0) add('connected', 'error', `concept "${id}" has no relations`);
  }
  const [start] = nodeIds;
  if (start !== undefined) {
    const seen = new Set([start]);
    const queue = [start];
    // for-of over an array also visits items pushed during the loop, which is exactly a BFS queue.
    for (const current of queue) {
      for (const next of adjacency.get(current) ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    const unreached = [...nodeIds].filter((id) => !seen.has(id) && (adjacency.get(id)?.length ?? 0) > 0);
    if (unreached.length) {
      add(
        'connected',
        'error',
        `${String(unreached.length)} concepts are cut off from the rest of the map: ${unreached.join(', ')}`,
      );
    }
  }

  // Sources.
  const unsourced = nodes.filter((n) => n.sources.length === 0).map((n) => n.id);
  if (unsourced.length) {
    const preview =
      unsourced.slice(0, 5).join(', ') +
      (unsourced.length > 5 ? `, +${String(unsourced.length - 5)} more` : '');
    add(
      'has-source',
      options.missingSources,
      `${String(unsourced.length)} concepts have no source: ${preview}`,
    );
  }

  return findings;
}
