import { expect, test } from '@playwright/test';

import { clickConcept, mapReady, search } from './helpers';

test('every page is served with the security headers', async ({ request }) => {
  for (const path of ['/', '/explore', '/cheatsheet', '/concept/cors', '/sitemap.xml']) {
    const res = await request.get(path);
    const h = res.headers();
    expect(h['content-security-policy'], path).toContain("frame-ancestors 'none'");
    expect(h['content-security-policy'], path).toContain("require-trusted-types-for 'script'");
    expect(h['content-security-policy'], path).not.toContain('unsafe-eval');
    expect(h['strict-transport-security'], path).toContain('max-age=63072000');
    expect(h['x-content-type-options'], path).toBe('nosniff');
    expect(h['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
    expect(h['permissions-policy'], path).toContain('camera=()');
  }
});

test('using the app triggers no CSP or Trusted Types violation', async ({ page }) => {
  const violations: string[] = [];
  await page.addInitScript(() => {
    const w = window as unknown as { __csp?: string[] };
    document.addEventListener('securitypolicyviolation', (e) => {
      (w.__csp ??= []).push(`${e.violatedDirective}: ${e.blockedURI}`);
    });
  });
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Trusted/i.test(m.text())) violations.push(m.text());
  });

  await page.goto('/explore');
  await mapReady(page);
  await clickConcept(page, 'event_loop');
  await search(page, 'cors');
  await page.getByRole('button', { name: /Your progress/ }).click(); // lazy chunk: IndexedDB
  await page.keyboard.press('Escape');
  await page.goto('/explore?from=set_state&to=gpu_process');
  await mapReady(page);
  await page.goto('/concept/dom');
  await page.goto('/cheatsheet');

  const recorded = await page.evaluate(() => (window as unknown as { __csp?: string[] }).__csp ?? []);
  expect([...violations, ...recorded]).toEqual([]);
});
