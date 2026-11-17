import type { MetadataRoute } from 'next';

import { conceptGraph } from '@/lib/content';
import { siteUrl } from '@/lib/site';

export default function sitemap(): MetadataRoute.Sitemap {
  const url = (path: string) => new URL(path, siteUrl).toString();
  return [
    { url: url('/'), changeFrequency: 'monthly', priority: 1 },
    { url: url('/explore'), changeFrequency: 'monthly', priority: 0.9 },
    { url: url('/cheatsheet'), changeFrequency: 'weekly', priority: 0.8 },
    ...[...conceptGraph.nodes.values()].map((n) => ({
      url: url(`/concept/${n.id}`),
      lastModified: n.verified,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ];
}
