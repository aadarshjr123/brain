import { expect, test } from '@playwright/test';

import { mapReady, search } from './helpers';

test('on a phone the card is a bottom sheet and the map stays usable', async ({ page }) => {
  await page.goto('/explore');
  await mapReady(page);
  await search(page, 'dom');
  const card = page.getByRole('complementary', { name: 'DOM' });
  await expect(card).toBeVisible();
  const box = await card.boundingBox();
  const viewport = page.viewportSize();
  expect(box && viewport && box.y + box.height).toBeCloseTo(viewport?.height ?? 0, -1);
  await expect(page.getByRole('heading', { name: 'Layers' })).toBeHidden();
});

test.describe('narrowest phone (360 px)', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  test('every top-bar control is fully on screen', async ({ page }) => {
    await page.goto('/explore');
    await mapReady(page);
    const controls = [
      page.getByRole('link', { name: /Brain/ }),
      page.getByRole('combobox', { name: 'Jump to a concept' }),
      page.getByRole('group', { name: 'Mode' }),
      page.getByRole('button', { name: /Your progress/ }),
      page.getByRole('toolbar', { name: 'Map controls' }),
    ];
    for (const control of controls) {
      const box = (await control.boundingBox()) ?? { x: -1, width: 0 };
      expect(box.x, String(control)).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width, String(control)).toBeLessThanOrEqual(360);
    }
  });
});
