import { graph as content } from '@brain/content';
import { seededRandom } from '@brain/graph-engine';
import { describe, expect, it } from 'vitest';

import { EXPLORE } from './config';
import { ExploreController } from './controller';

let clock = 0;
const make = () =>
  new ExploreController({ content, reducedMotion: true, random: seededRandom(3), now: () => (clock += 1) });

describe('ExploreController (no DOM)', () => {
  it('starts with the seed concepts visible', () => {
    const c = make();
    expect([...c.store.getState().visible].sort()).toEqual([...EXPLORE.seeds].sort());
  });

  it('opening a concept unfolds one page of neighbours and selects it', () => {
    const c = make();
    const before = c.hiddenCount('event_loop');
    c.open('event_loop');
    const shown = Math.min(before, EXPLORE.unfoldPage);
    expect(c.store.getState().selectedId).toBe('event_loop');
    expect(c.hiddenCount('event_loop')).toBe(before - shown);
    expect(c.store.getState().trail).toEqual(['event_loop']);
  });

  it('pages a hub: unfold shows 12, the next unfold shows the rest', () => {
    // No concept in today's content has more than 12 neighbours, so use a fixture hub with 15.
    const spokes = Array.from({ length: 15 }, (_, i) => `spoke_${String(i)}`);
    const node = (id: string) => ({
      id,
      label: id,
      domain: 'js',
      summary: 'x',
      aliases: [],
      sources: [],
      verified: '2026-11-17',
    });
    const c = new ExploreController({
      content: {
        domains: [{ id: 'js', name: 'JS', description: 'x' }],
        nodes: [node('hub'), ...spokes.map(node)],
        edges: spokes.map((to) => ({ from: 'hub', to, relation: 'r', weight: 1 as const })),
      },
      reducedMotion: true,
      random: seededRandom(3),
    });
    c.reveal('hub');
    expect(c.unfold('hub')).toBe(EXPLORE.unfoldPage);
    expect(c.hiddenCount('hub')).toBe(15 - EXPLORE.unfoldPage);
    expect(c.unfold('hub')).toBe(15 - EXPLORE.unfoldPage);
    expect(c.hiddenCount('hub')).toBe(0);
  });

  it('folding removes only the neighbours that would dangle and never the seeds', () => {
    const c = make();
    c.open('event_loop');
    const removed = c.fold('event_loop');
    expect(removed).toBeGreaterThan(0);
    for (const seed of EXPLORE.seeds) expect(c.store.getState().visible.has(seed)).toBe(true);
  });

  it('folding away the selected concept clears the selection', () => {
    const c = make();
    c.open('event_loop');
    const leaf = c.layout.foldable('event_loop', new Set(EXPLORE.seeds))[0] ?? '';
    c.select(leaf);
    c.fold('event_loop');
    expect(c.store.getState().selectedId).toBeNull();
  });

  it('unfold everything shows the whole graph; reset returns to the seeds', () => {
    const c = make();
    c.unfoldAll();
    expect(c.store.getState().visible.size).toBe(content.nodes.length);
    c.select('dom');
    c.toggleDomain('js');
    c.reset();
    const s = c.store.getState();
    expect(s.visible.size).toBe(EXPLORE.seeds.length);
    expect(s.selectedId).toBeNull();
    expect(s.trail).toEqual([]);
    expect(s.activeDomains.size).toBe(content.domains.length);
  });

  it('a click on empty space clears the selection in explore mode', () => {
    const c = make();
    c.open('dom');
    c.onCanvasClick(null);
    expect(c.store.getState().selectedId).toBeNull();
  });

  it('the scene focuses only in explore mode with a selection', () => {
    const c = make();
    expect(c.scene().focus).toBe(false);
    c.select('dom');
    expect(c.scene().focus).toBe(true);
  });

  it('restores a link: layers, then selection with its neighbours unfolded', () => {
    const c = make();
    c.applyUrlState(c.parseUrl('?n=gpu_process&layers=browser,net'));
    const s = c.store.getState();
    expect(s.selectedId).toBe('gpu_process');
    expect(s.visible.has('gpu_process')).toBe(true);
    expect([...s.activeDomains]).toEqual(['browser', 'net']);
    expect(c.serialiseUrl()).toBe('?n=gpu_process&layers=browser,net');
  });

  it('ignores a link to a concept that does not exist', () => {
    const c = make();
    c.applyUrlState(c.parseUrl('?n=not_a_concept'));
    expect(c.store.getState().selectedId).toBeNull();
    expect(c.serialiseUrl()).toBe('');
  });
});
