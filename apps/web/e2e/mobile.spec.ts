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
