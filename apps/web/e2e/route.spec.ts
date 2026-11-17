import { expect, test } from '@playwright/test';

import { mapReady, search, state } from './helpers';

test.describe('route', () => {
  test('a shared link opens a drawn route that narrates each hop', async ({ page }) => {
    await page.goto('/explore?from=set_state&to=gpu_process');
    await mapReady(page);
    const { path } = await state(page);
    expect(path?.[0]).toBe('set_state');
    expect(path?.at(-1)).toBe('gpu_process');
    await expect(page.getByRole('heading', { level: 2, name: /setState .* → GPU process/ })).toBeVisible();
    // The pulse reaches later hops over time, and the card follows it.
    await expect.poll(async () => (await state(page)).hop, { timeout: 6000 }).toBeGreaterThanOrEqual(2);
    await expect(page.locator('[aria-current="step"]')).toHaveCount(1);
  });

  test('picking two concepts in Route mode draws the shortest path and updates the URL', async ({ page }) => {
    await page.goto('/explore');
    await mapReady(page);
    await page.getByRole('group', { name: 'Mode' }).getByRole('button', { name: 'route' }).click();
    await search(page, 'cors');
    await search(page, 'fiber');
    await expect(page).toHaveURL(/from=cors&to=fiber/);
    expect((await state(page)).path?.length).toBeGreaterThan(2);
    await page.getByRole('button', { name: 'Reverse' }).click();
    await expect(page).toHaveURL(/from=fiber&to=cors/);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('button', { name: 'Reverse' })).toHaveCount(0);
  });
});
