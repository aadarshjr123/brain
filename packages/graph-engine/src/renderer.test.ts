import { beforeEach, describe, expect, it, vi } from 'vitest';

import { seededRandom } from './geometry.ts';
import { buildGraph } from './graph.ts';
import { Layout } from './layout.ts';
import { MOTION } from './motion.ts';
import { type Palette, Renderer, type Scene, type Scheduler } from './renderer.ts';
import { recordingCanvas } from './test/recording-canvas.ts';

const nodes = [
  { id: 'a', label: 'Alpha', domain: 'js' },
  { id: 'b', label: 'Beta', domain: 'js' },
  { id: 'c', label: 'Gamma', domain: 'net' },
  { id: 'd', label: 'Delta', domain: 'net' },
];
const graph = buildGraph(nodes, [
  { from: 'a', to: 'b', relation: 'drives' },
  { from: 'b', to: 'c', relation: 'feeds' },
  { from: 'c', to: 'd', relation: 'opens' },
]);
const palette: Palette = {
  bg: 'BG',
  fg: 'FG',
  muted: 'MUTED',
  lineStrong: 'LINE',
  accent: 'ACCENT',
  accentInk: 'INK',
  surfaceSolid: 'SURFACE',
  domains: { js: 'JS', net: 'NET' },
};
const idle: Scene = {
  selectedId: null,
  hoverId: null,
  focus: false,
  route: null,
  routeFrom: null,
  routeTo: null,
  activeDomains: new Set(['js', 'net']),
};

let scene: Scene;
let now: number;
let hidden = false;
function setup(options: { reducedMotion?: boolean; ids?: string[] } = {}) {
  const rec = recordingCanvas();
  const layout = new Layout(graph, { random: seededRandom(1), now: () => now, reducedMotion: true });
  layout.addLoose(options.ids ?? ['a', 'b', 'c']);
  const pending: ((t: number) => void)[] = [];
  const scheduler: Scheduler = {
    request: (cb) => pending.push(cb),
    cancel: () => undefined,
    isHidden: () => hidden,
  };
  const onHop = vi.fn();
  const renderer = new Renderer({
    canvas: rec.canvas,
    graph,
    layout,
    scene: () => scene,
    palette,
    fonts: { sans: 'Sans', mono: 'Mono' },
    reducedMotion: options.reducedMotion ?? false,
    scheduler,
    onHop,
  });
  renderer.resize(800, 600, 2);
  renderer.setTransform({ x: 400, y: 300, k: 1 });
  return { rec, layout, renderer, pending, onHop };
}

beforeEach(() => {
  scene = { ...idle };
  now = 1000;
  hidden = false;
});

describe('Renderer', () => {
  it('sizes the backing store by device pixel ratio, capped at 2', () => {
    const { rec, renderer } = setup();
    expect([rec.canvas.width, rec.canvas.height]).toEqual([1600, 1200]);
    renderer.resize(100, 100, 3);
    expect(rec.canvas.width).toBe(200);
  });

  it('draws every visible node as ring, core and badge, with labels at zoom 1', () => {
    const { rec, renderer } = setup();
    rec.reset();
    renderer.draw(now + 10_000);
    // a, b, c: two arcs each for the body; b and c have one hidden neighbour each? only c (d is hidden).
    const arcs = rec.count('arc');
    expect(arcs).toBe(3 * 2 + 1);
    expect(rec.texts()).toEqual(expect.arrayContaining(['Alpha', 'Beta', 'Gamma', '1']));
  });

  it('dims everything outside the focus and labels the focused edges', () => {
    const { rec, renderer } = setup();
    scene = { ...idle, selectedId: 'a', focus: true };
    rec.reset();
    renderer.draw(now + 10_000);
    // c is not a neighbour of a: its body is drawn at 0.16 alpha.
    const cBody = rec.calls.filter((c) => c.method === 'fill' && c.fill === 'NET');
    expect(cBody.every((c) => c.alpha === 0.16)).toBe(true);
    expect(rec.texts()).toContain('drives');
    expect(rec.texts()).not.toContain('Gamma');
  });

  it('hides a layer when its domain is switched off', () => {
    const { rec, renderer } = setup();
    scene = { ...idle, activeDomains: new Set(['js']) };
    rec.reset();
    renderer.draw(now + 10_000);
    const net = rec.calls.filter((c) => c.method === 'fill' && c.fill === 'NET');
    expect(net.length).toBeGreaterThan(0);
    expect(net.every((c) => c.alpha === 0.16)).toBe(true);
  });

  it('pops nodes in: invisible before birth, full size after popMs', () => {
    const { rec, renderer } = setup();
    rec.reset();
    renderer.draw(now - 1); // before born
    expect(rec.count('arc')).toBe(0);
    rec.reset();
    renderer.draw(now + MOTION.popMs);
    expect(rec.count('arc')).toBeGreaterThan(0);
  });

  it('collapses tweens under reduced motion: full size immediately', () => {
    const { rec, renderer } = setup({ reducedMotion: true });
    rec.reset();
    renderer.draw(now - 1);
    expect(rec.count('arc')).toBeGreaterThan(0);
  });

  it('draws a route one hop at a time and reports hops as the pulse arrives', () => {
    const { rec, renderer, layout, onHop } = setup({ ids: ['a', 'b', 'c', 'd'] });
    layout.addLoose(['d']);
    scene = { ...idle, route: { path: ['a', 'b', 'c', 'd'], startedAt: now }, routeFrom: 'a', routeTo: 'd' };
    const routeStrokes = () =>
      rec.calls.filter((c) => c.method === 'stroke' && c.stroke === 'ACCENT').length -
      // halos on route nodes also stroke in accent: 4 nodes on the path
      4;

    rec.reset();
    renderer.draw(now + MOTION.hopMs * 0.5);
    expect(routeStrokes()).toBe(1);
    expect(onHop).toHaveBeenLastCalledWith(0);

    rec.reset();
    renderer.draw(now + MOTION.hopMs * 2.5);
    expect(routeStrokes()).toBe(3);
    expect(onHop).toHaveBeenLastCalledWith(2);
    expect(rec.texts()).toEqual(expect.arrayContaining(['drives', 'feeds']));
  });

  it('only reports a hop when it changes, not every frame', () => {
    const { renderer, onHop } = setup();
    scene = { ...idle, route: { path: ['a', 'b'], startedAt: now } };
    renderer.draw(now + 10);
    renderer.draw(now + 20);
    renderer.draw(now + 30);
    expect(onHop).toHaveBeenCalledTimes(1);
  });

  it('is demand-driven: draws when invalidated, then stops scheduling when idle', () => {
    const { renderer, pending } = setup({ reducedMotion: true });
    renderer.start();
    expect(pending).toHaveLength(1);
    pending.shift()?.(now);
    expect(renderer.framesDrawn).toBe(1);
    expect(pending).toHaveLength(0); // idle: no further frames requested

    renderer.setTransform({ x: 0, y: 0, k: 2 });
    expect(pending).toHaveLength(1);
    pending.shift()?.(now);
    expect(renderer.framesDrawn).toBe(2);
  });

  it('keeps animating while a halo breathes, and not under reduced motion', () => {
    const animated = setup();
    scene = { ...idle, selectedId: 'a' };
    expect(animated.renderer.frame(now + 10_000)).toBe(true);
    const reduced = setup({ reducedMotion: true });
    expect(reduced.renderer.frame(now + 10_000)).toBe(false);
  });

  it('draws nothing while the tab is hidden, and resumes on the next invalidate', () => {
    const { renderer, pending } = setup();
    renderer.start();
    hidden = true;
    pending.shift()?.(now);
    expect(renderer.framesDrawn).toBe(0);
    expect(pending).toHaveLength(0); // no busy loop in a background tab

    hidden = false;
    renderer.invalidate(); // the app calls this on visibilitychange
    pending.shift()?.(now);
    expect(renderer.framesDrawn).toBe(1);
  });

  it('converts screen points to world points and hits nodes with a zoom-independent radius', () => {
    const { renderer, layout } = setup();
    const a = layout.get('a');
    renderer.setTransform({ x: 100, y: 50, k: 2 });
    expect(renderer.toWorld(102, 54)).toEqual([1, 2]);
    expect(renderer.hit((a?.x ?? 0) * 2 + 100 + 10, (a?.y ?? 0) * 2 + 50)?.id).toBe('a');
  });
});
