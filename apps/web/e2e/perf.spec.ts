import { writeFileSync } from 'node:fs';

import { expect, test } from '@playwright/test';

import { clickConcept, mapReady } from './helpers';

/**
 * Frame timing during an unfold (BRAIN-16 follow-up): draw + layout in a real canvas, measured with rAF deltas.
 * CI machines are noisy and shared, so the assertion is loose; the numbers are written out for the journal.
 */
test('unfold animates without long frames', async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop');
  await page.goto('/explore');
  await mapReady(page);
  await page.evaluate(() => {
    const w = window as unknown as { __frames: number[] };
    w.__frames = [];
    let last = performance.now();
    const tick = (now: number) => {
      w.__frames.push(now - last);
      last = now;
      if (w.__frames.length < 120) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
  await clickConcept(page, 'event_loop');
  await page.getByRole('button', { name: 'Unfold everything' }).click();
  await page.waitForFunction(() => (window as unknown as { __frames: number[] }).__frames.length >= 120);
  const frames = await page.evaluate(() => (window as unknown as { __frames: number[] }).__frames.slice(5));
  frames.sort((a, b) => a - b);
  const p = (q: number) => frames[Math.floor(q * (frames.length - 1))] ?? 0;
  const summary = { p50: p(0.5), p95: p(0.95), max: p(1), frames: frames.length };
  writeFileSync(info.outputPath('frame-timing.json'), JSON.stringify(summary, null, 2));
  console.log(
    `frame timing during unfold-all: p50 ${summary.p50.toFixed(1)} ms, p95 ${summary.p95.toFixed(1)} ms`,
  );
  expect(summary.p95).toBeLessThan(50);
});
