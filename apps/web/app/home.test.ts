import { describe, expect, it } from 'vitest';

import { routeAsText } from '@/lib/content';

// The home page promises "a chain of cause and effect": every example must be a real chain, not one hop.
describe('home page examples', () => {
  it.each([
    ['set_state', 'gpu_process'],
    ['cors', 'fiber'],
    ['localstorage', 'inp'],
  ])('%s → %s is a route of at least 3 hops', (from, to) => {
    expect(routeAsText(from, to)?.length ?? 0).toBeGreaterThanOrEqual(4);
  });
});
