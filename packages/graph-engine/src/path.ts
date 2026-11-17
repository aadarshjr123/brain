import type { Graph } from './graph.ts';

/**
 * Shortest chain of relations between two concepts, ignoring direction: a route is a story of
 * cause and effect you can read either way. Breadth-first search, O(V + E): microseconds at our size.
 * Neighbours are expanded in content order, so the result is deterministic for a given graph.
 *
 * @returns the ids from `from` to `to` inclusive, `[from]` when they are equal, or null when unreachable.
 */
export function shortestPath(graph: Graph, from: string, to: string): string[] | null {
  if (!graph.has(from) || !graph.has(to)) return null;
  if (from === to) return [from];

  const previous = new Map<string, string | null>([[from, null]]);
  const queue = [from];
  // for-of over a growing array visits pushed items, which is exactly a BFS queue.
  for (const current of queue) {
    for (const { id } of graph.neighbours(current)) {
      if (previous.has(id)) continue;
      previous.set(id, current);
      if (id === to) return walkBack(previous, to);
      queue.push(id);
    }
  }
  return null;
}

function walkBack(previous: ReadonlyMap<string, string | null>, to: string): string[] {
  const path: string[] = [];
  for (let at: string | null | undefined = to; at != null; at = previous.get(at)) path.push(at);
  return path.reverse();
}

/** Hop distances from one node to every reachable node. Used by tests and by "nearby" suggestions. */
export function distancesFrom(graph: Graph, from: string): Map<string, number> {
  const distance = new Map([[from, 0]]);
  const queue = [from];
  for (const current of queue) {
    const d = distance.get(current) ?? 0;
    for (const { id } of graph.neighbours(current)) {
      if (distance.has(id)) continue;
      distance.set(id, d + 1);
      queue.push(id);
    }
  }
  return distance;
}
