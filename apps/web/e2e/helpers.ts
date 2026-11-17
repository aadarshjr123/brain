import { graph } from '@brain/content';
import { type Page, expect } from '@playwright/test';

/** Concept count from the content, so tests do not break when concepts are added. */
export const TOTAL = graph.nodes.length;

interface BrainHandle {
  settled: boolean;
  screenPoint(id: string): { x: number; y: number } | null;
  store: {
    getState(): {
      selectedId: string | null;
      visible: Set<string>;
      route: { path: string[] | null };
      hop: number;
    };
  };
}

declare global {
  interface Window {
    __brain?: BrainHandle;
  }
}

/** Waits until the map is mounted and the layout has come to rest. */
export async function mapReady(page: Page): Promise<void> {
  await page.waitForFunction(() => window.__brain?.settled === true, null, { timeout: 15_000 });
}

/** Clicks a concept where the canvas draws it. */
export async function clickConcept(page: Page, id: string): Promise<void> {
  await mapReady(page);
  const point = await page.evaluate((i) => window.__brain?.screenPoint(i) ?? null, id);
  expect(point, `${id} is on the map`).not.toBeNull();
  const box = await page.locator('canvas').boundingBox();
  if (!point || !box) throw new Error('canvas not ready');
  await page.mouse.click(box.x + point.x, box.y + point.y);
}

export const state = (page: Page) =>
  page.evaluate(() => {
    const s = window.__brain?.store.getState();
    return s
      ? { selectedId: s.selectedId, visible: s.visible.size, path: s.route.path, hop: s.hop }
      : { selectedId: null, visible: 0, path: null, hop: -1 };
  });

/** Picks a concept through the search box, the way a keyboard user would. */
export async function search(page: Page, text: string): Promise<void> {
  await page.keyboard.press('/');
  await page.keyboard.type(text);
  await page.keyboard.press('Enter');
}
