/**
 * The graph model: adjacency with direction and relation, built once from content.
 * Framework-free and allocation-light; every lookup the renderer and UI need is O(1) or O(degree).
 */

export interface GraphNodeInput {
  id: string;
}

export interface GraphEdgeInput {
  from: string;
  to: string;
  relation: string;
  weight?: number;
}

/** One end of a relation as seen from a node. `out`: this node drives `id`. `in`: `id` drives this node. */
export interface Neighbour {
  id: string;
  relation: string;
  direction: 'out' | 'in';
  weight: number;
}

export interface Graph<N extends GraphNodeInput = GraphNodeInput> {
  readonly nodes: ReadonlyMap<string, N>;
  readonly edges: readonly GraphEdgeInput[];
  /** Neighbours in edge order: outgoing and incoming mixed, exactly as the content lists them. */
  neighbours(id: string): readonly Neighbour[];
  degree(id: string): number;
  has(id: string): boolean;
  /** The relation between two adjacent nodes, read from `a`'s side, or undefined if not adjacent. */
  relationBetween(a: string, b: string): Neighbour | undefined;
}

const NONE: readonly Neighbour[] = Object.freeze([]);

export function buildGraph<N extends GraphNodeInput>(
  nodes: readonly N[],
  edges: readonly GraphEdgeInput[],
): Graph<N> {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  const adjacency = new Map<string, Neighbour[]>(nodes.map((n) => [n.id, []]));

  for (const { from, to, relation, weight = 1 } of edges) {
    const out = adjacency.get(from);
    const inn = adjacency.get(to);
    // Content is validated at build; skipping here keeps the engine safe with partial test fixtures.
    if (!out || !inn) continue;
    out.push({ id: to, relation, direction: 'out', weight });
    inn.push({ id: from, relation, direction: 'in', weight });
  }

  return {
    nodes: byId,
    edges,
    neighbours: (id) => adjacency.get(id) ?? NONE,
    degree: (id) => adjacency.get(id)?.length ?? 0,
    has: (id) => byId.has(id),
    relationBetween: (a, b) => adjacency.get(a)?.find((n) => n.id === b),
  };
}
