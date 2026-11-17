import { expect, test } from '@playwright/test';

import { mapReady } from './helpers';

test('the map and visited pages work offline after the first visit', async ({ page, context }) => {
  await page.goto('/explore');
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload(); // now controlled by the worker, which caches the map's code
  await mapReady(page);
  await page.goto('/concept/dom');
  await expect(page.getByRole('heading', { level: 1, name: 'DOM' })).toBeVisible();

  await context.setOffline(true);
  await page.goto('/explore');
  await mapReady(page);
  await expect(page.locator('canvas')).toBeVisible();
  await page.goto('/concept/dom');
  await expect(page.getByRole('heading', { level: 1, name: 'DOM' })).toBeVisible();
  await page.goto('/concept/v8');
  await expect(page.getByRole('heading', { level: 1, name: 'You are offline' })).toBeVisible();
});
