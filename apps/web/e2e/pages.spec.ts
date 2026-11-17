import { expect, test } from '@playwright/test';

test.describe('text pages', () => {
  test('home explains the product and links into the map', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('touches inside the browser');
    await page.getByRole('link', { name: 'Open the map' }).click();
    await expect(page).toHaveURL(/\/explore$/);
  });

  test('a concept page lists relations, routes and sources and opens the map', async ({ page }) => {
    await page.goto('/concept/cors');
    await expect(page.getByRole('heading', { level: 1, name: 'CORS' })).toBeVisible();
    await expect(page.getByRole('heading', { name: /Driven by/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'How it reaches the big ideas' })).toBeVisible();
    await page.getByRole('link', { name: 'Open in the map' }).click();
    await expect(page).toHaveURL(/\/explore\?n=cors/);
  });

  test('concept pages work without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('/concept/event_loop');
    await expect(page.getByRole('heading', { level: 1, name: 'Event loop' })).toBeVisible();
    await page
      .getByRole('link', { name: /Microtask queue/ })
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1, name: 'Microtask queue' })).toBeVisible();
    await context.close();
  });

  test('the cheatsheet filters as you type', async ({ page }) => {
    await page.goto('/cheatsheet');
    await expect(page.getByRole('status')).toHaveText('144 shown');
    await page.getByRole('searchbox', { name: 'Filter concepts' }).fill('paint');
    await expect(page.getByRole('status')).not.toHaveText('144 shown');
  });

  test('unknown concepts are a 404', async ({ page }) => {
    const response = await page.goto('/concept/not_a_concept');
    expect(response?.status()).toBe(404);
  });
});
