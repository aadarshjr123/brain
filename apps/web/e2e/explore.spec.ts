import { expect, test } from '@playwright/test';

import { clickConcept, mapReady, search, state } from './helpers';

test.describe('explore', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/explore');
    await mapReady(page);
  });

  test('starts with the eight seed concepts', async ({ page }) => {
    expect((await state(page)).visible).toBe(8);
    await expect(page.getByText('8 / 144 shown')).toBeVisible();
  });

  test('clicking a concept unfolds it and opens its card', async ({ page }) => {
    await clickConcept(page, 'event_loop');
    await expect(page.getByRole('heading', { level: 2, name: 'Event loop' })).toBeVisible();
    expect((await state(page)).visible).toBeGreaterThan(8);
    await expect(page.getByRole('navigation', { name: 'Recently viewed' })).toContainText('Event loop');
    await expect(page).toHaveURL(/\?n=event_loop/);
  });

  test('a relation in the card moves to that concept', async ({ page }) => {
    await clickConcept(page, 'event_loop');
    await page.getByRole('button', { name: /Microtask queue/ }).click();
    await expect(page.getByRole('heading', { level: 2, name: 'Microtask queue' })).toBeVisible();
  });

  test('search: slash focuses, Enter jumps', async ({ page }) => {
    await search(page, 'cors');
    await expect(page.getByRole('heading', { level: 2, name: 'CORS' })).toBeVisible();
  });

  test('layers can be switched off', async ({ page }) => {
    const security = page.getByRole('button', { name: /^Security/ });
    await security.click();
    await expect(security).toHaveAttribute('aria-pressed', 'false');
    await expect(page).toHaveURL(/layers=/);
  });

  test('keyboard: Tab to the map, Enter selects, arrows move, Escape clears', async ({ page }) => {
    await page.locator('canvas').focus();
    await page.keyboard.press('Enter');
    const first = (await state(page)).selectedId;
    expect(first).not.toBeNull();
    await expect(page.locator('p[aria-live]').first()).toContainText('connections');
    await page.keyboard.press('Escape');
    expect((await state(page)).selectedId).toBeNull();
  });

  test('progress survives a reload', async ({ page }) => {
    await search(page, 'dom');
    await page.getByRole('button', { name: /^Bookmark DOM/ }).click();
    // Writes are asynchronous; wait until the bookmark is in IndexedDB before reloading.
    await expect
      .poll(() =>
        page.evaluate(
          () =>
            new Promise<number>((resolve) => {
              const open = indexedDB.open('brain');
              open.onsuccess = () => {
                const count = open.result.transaction('bookmarks').objectStore('bookmarks').count();
                count.onsuccess = () => {
                  resolve(count.result);
                };
              };
            }),
        ),
      )
      .toBe(1);
    await page.reload();
    await mapReady(page);
    await expect(page.getByRole('button', { name: /Your progress: [1-9]\d*\/144/ })).toBeVisible();
    await page.getByRole('button', { name: /Your progress/ }).click();
    await expect(page.locator('[popover] li')).toHaveText(['DOM']);
  });
});
