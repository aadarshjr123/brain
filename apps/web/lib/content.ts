import { type ConceptNode, graph } from '@brain/content';
import { type Graph, buildGraph, shortestPath } from '@brain/graph-engine';

import { EXPLORE } from '@/features/explore/config';

/** Server-side view of the content: one graph for every static page. */
export const conceptGraph: Graph<ConceptNode> = buildGraph(graph.nodes, graph.edges);
export const domains = graph.domains;

const domainNames = new Map(graph.domains.map((d) => [d.id, d.name]));
export const domainName = (id: string): string => domainNames.get(id) ?? id;

export function concept(id: string): ConceptNode | undefined {
  return conceptGraph.nodes.get(id);
}

export function conceptsByDomain(): { domain: (typeof graph.domains)[number]; nodes: ConceptNode[] }[] {
  return graph.domains.map((domain) => ({
    domain,
    nodes: graph.nodes.filter((n) => n.domain === domain.id).sort((a, b) => a.label.localeCompare(b.label)),
  }));
}

export interface Hop {
  id: string;
  label: string;
  /** Relation from the previous hop, in travel direction; empty for the first. */
  via: string;
}

/** A route as text: the same chain the map animates, for pages that must work without JavaScript. */
export function routeAsText(from: string, to: string): Hop[] | null {
  const path = shortestPath(conceptGraph, from, to);
  if (!path) return null;
  return path.map((id, i) => {
    const prev = i > 0 ? path[i - 1] : undefined;
    const rel = prev === undefined ? undefined : conceptGraph.relationBetween(prev, id);
    return {
      id,
      label: concept(id)?.label ?? id,
      via: rel ? (rel.direction === 'out' ? rel.relation : `← ${rel.relation}`) : '',
    };
  });
}

/** Routes worth showing on a concept page: to each seed hub, shortest first, at most `limit`. */
export function routesToHubs(id: string, limit = 3): Hop[][] {
  return EXPLORE.seeds
    .filter((hub) => hub !== id && !conceptGraph.relationBetween(id, hub))
    .map((hub) => routeAsText(id, hub))
    .filter((r): r is Hop[] => r !== null && r.length > 2)
    .sort((a, b) => a.length - b.length)
    .slice(0, limit);
}
