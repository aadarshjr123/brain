import type { ConceptNode } from '@brain/content';

export interface SearchIndex {
  query(text: string, limit?: number): ConceptNode[];
}

/**
 * Ranked substring search over labels, ids, aliases and summaries. 144 concepts need no library:
 * a label prefix beats a label match, which beats an alias, which beats the summary.
 */
export function createSearchIndex(
  nodes: Iterable<ConceptNode>,
  /** Tie-break: more connected concepts first, since they are what people look for most. */
  importance: (id: string) => number = () => 0,
): SearchIndex {
  const rows = [...nodes].map((node) => ({
    node,
    label: node.label.toLowerCase(),
    id: node.id.replaceAll('_', ' '),
    aliases: node.aliases.map((a) => a.toLowerCase()),
    summary: node.summary.toLowerCase(),
    weight: importance(node.id),
  }));

  return {
    query(text, limit = 8) {
      const q = text.trim().toLowerCase();
      if (!q) return [];
      const scored: { node: ConceptNode; score: number; weight: number }[] = [];
      for (const r of rows) {
        let score = 0;
        if (r.label.startsWith(q)) score = 4;
        else if (r.label.includes(q) || r.id.includes(q)) score = 3;
        else if (r.aliases.some((a) => a.includes(q))) score = 2;
        else if (r.summary.includes(q)) score = 1;
        if (score) scored.push({ node: r.node, score, weight: r.weight });
      }
      scored.sort(
        (a, b) => b.score - a.score || b.weight - a.weight || a.node.label.localeCompare(b.node.label),
      );
      return scored.slice(0, limit).map((s) => s.node);
    },
  };
}
