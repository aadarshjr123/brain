import { describe, expect, it } from 'vitest';

import { conceptsByDomain, routeAsText, routesToHubs } from './content';

describe('content helpers', () => {
  it('groups every concept under its domain, alphabetically', () => {
    const groups = conceptsByDomain();
    expect(groups.reduce((n, g) => n + g.nodes.length, 0)).toBeGreaterThanOrEqual(144);
    for (const g of groups) {
      const labels = g.nodes.map((n) => n.label);
      expect(labels).toEqual([...labels].sort((a, b) => a.localeCompare(b)));
    }
  });

  it('writes a route as text with relations in travel direction', () => {
    const route = routeAsText('microtask_queue', 'event_loop');
    expect(route?.map((h) => h.id)).toEqual(['microtask_queue', 'event_loop']);
    expect(route?.[0]?.via).toBe('');
    expect(route?.[1]?.via).toMatch(/^← /);
  });

  it('suggests a few non-trivial routes to hubs, shortest first', () => {
    const routes = routesToHubs('cors');
    expect(routes.length).toBeGreaterThan(0);
    expect(routes.length).toBeLessThanOrEqual(3);
    for (const r of routes) expect(r.length).toBeGreaterThan(2);
    const lengths = routes.map((r) => r.length);
    expect(lengths).toEqual([...lengths].sort((a, b) => a - b));
  });
});
