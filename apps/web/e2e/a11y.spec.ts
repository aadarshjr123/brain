import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

import { mapReady } from './helpers';

const PAGES = [
  '/',
  '/explore',
  '/explore?n=event_loop',
  '/explore?from=cors&to=fiber',
  '/cheatsheet',
  '/concept/cors',
];

for (const scheme of ['dark', 'light'] as const) {
  test.describe(`accessibility, ${scheme} theme`, () => {
    test.use({ colorScheme: scheme });
    for (const path of PAGES) {
      test(`${path} has no serious or critical axe violations`, async ({ page }) => {
        await page.goto(path);
        if (path.startsWith('/explore')) await mapReady(page);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
          .analyze();
        const blocking = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(
          blocking.map(
            (v) =>
              `${v.id}: ${v.help} (${v.nodes
                .map((n) => n.target.join(' '))
                .slice(0, 3)
                .join(', ')})`,
          ),
        ).toEqual([]);
      });
    }
  });
}
