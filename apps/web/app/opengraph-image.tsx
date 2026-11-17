import { conceptGraph, domains } from '@/lib/content';
import { OG, ogCard, ogSize } from '@/lib/og/card';

export const size = ogSize;
export const contentType = 'image/png';
export const alt = 'Brain: a free map of how frontend development touches the browser';

export default function Image() {
  return ogCard({
    eyebrow: `${String(conceptGraph.nodes.size)} concepts · free · no login`,
    colour: OG.accent,
    title: 'See what your code touches inside the browser.',
    text: 'Unfold any concept to see what it drives and what drives it, or trace the shortest chain of cause and effect between two.',
    chips: domains.slice(0, 5).map((d) => ({ label: d.name, colour: OG.domains[d.id] ?? OG.muted })),
  });
}
