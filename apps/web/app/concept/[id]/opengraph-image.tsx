import { concept, conceptGraph, domainName } from '@/lib/content';
import { OG, ogCard, ogSize } from '@/lib/og/card';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'A concept on Brain, the frontend and browser map';

export function generateStaticParams() {
  return [...conceptGraph.nodes.keys()].map((id) => ({ id }));
}

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const node = concept((await params).id);
  if (!node)
    return ogCard({ eyebrow: 'Brain', colour: OG.accent, title: 'Concept not found', text: '', chips: [] });
  return ogCard({
    eyebrow: domainName(node.domain),
    colour: OG.domains[node.domain] ?? OG.accent,
    title: node.label,
    text: node.summary,
    chips: conceptGraph.neighbours(node.id).map((n) => {
      const to = concept(n.id);
      return { label: to?.label ?? n.id, colour: OG.domains[to?.domain ?? ''] ?? OG.muted };
    }),
  });
}
