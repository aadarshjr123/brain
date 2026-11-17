import { describe, expect, it } from 'vitest';

import { conceptGraph } from '@/lib/content';

import manifest from './manifest';
import robots from './robots';
import sitemap from './sitemap';

describe('search and install metadata', () => {
  it('lists the three main pages and every concept in the sitemap', () => {
    const urls = sitemap().map((e) => new URL(e.url).pathname);
    expect(urls.slice(0, 3)).toEqual(['/', '/explore', '/cheatsheet']);
    expect(urls.filter((u) => u.startsWith('/concept/'))).toHaveLength(conceptGraph.nodes.size);
  });

  it('points robots at the sitemap and keeps debug pages out', () => {
    const r = robots();
    expect(String(r.sitemap)).toMatch(/\/sitemap\.xml$/);
    expect(r.rules).toMatchObject({ disallow: '/debug/' });
  });

  it('declares installable icons and starts on the map', () => {
    const m = manifest();
    expect(m.start_url).toBe('/explore');
    expect(m.icons?.map((i) => i.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  });
});
