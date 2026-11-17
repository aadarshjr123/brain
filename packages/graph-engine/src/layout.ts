import {
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  type Simulation,
  type SimulationLinkDatum,
  type SimulationNodeDatum,
} from 'd3-force';

import { nodeRadius } from './geometry.ts';
import type { Graph } from './graph.ts';
import { MOTION } from './motion.ts';

export interface LayoutNode extends SimulationNodeDatum {
  id: string;
  degree: number;
  radius: number;
  /** When the node starts popping in (ms, same clock as `now`). Staggered on unfold. */
  born: number;
  x: number;
  y: number;
}

export interface LayoutLink extends SimulationLinkDatum<LayoutNode> {
  key: string;
  source: LayoutNode;
  target: LayoutNode;
  relation: string;
  /** When the edge starts growing: once both ends exist. */
  born: number;
}

export interface LayoutOptions {
  /** Seeded in tests; Math.random in the app. Used for ring rotation and jitter. */
  random?: () => number;
  /** Clock for `born` stamps. performance.now in the app. */
  now?: () => number;
  /** Settle synchronously instead of animating (prefers-reduced-motion). */
  reducedMotion?: boolean;
}

/** Forces, as tuned in mockup v3. */
export const FORCES = {
  charge: -520,
  chargeDistanceMax: 600,
  linkDistance: (sourceDegree: number, targetDegree: number) =>
    110 + Math.min(90, (sourceDegree + targetDegree) * 3),
  linkStrength: 0.5,
  collidePadding: 30,
  centerStrength: 0.02,
  axisStrength: 0.015,
  alphaDecay: 0.03,
  /** Unfold ring radius: grows with the number of children so they do not overlap. */
  ringRadius: (children: number) => 90 + children * 6,
  /** Jitter radius when a single node is revealed next to another. */
  revealJitter: 60,
  /** Ticks used to settle at once under reduced motion. */
  settleTicks: 140,
  dragAlphaTarget: 0.3,
} as const;

/**
 * Force layout for the visible part of the graph. Owns positions; knows nothing about canvas or React.
 * It never runs its own timer: the renderer calls `step()` once per frame, so there is one loop,
 * and it stops when the tab is hidden or the layout has settled.
 */
export class Layout {
  readonly #graph: Graph;
  readonly #random: () => number;
  readonly #now: () => number;
  readonly #reduced: boolean;
  readonly #sim: Simulation<LayoutNode, LayoutLink>;
  readonly #nodes = new Map<string, LayoutNode>();
  readonly #linkBorn = new Map<string, number>();
  #links: LayoutLink[] = [];
  readonly #timers = new Set<ReturnType<typeof setTimeout>>();

  constructor(graph: Graph, options: LayoutOptions = {}) {
    this.#graph = graph;
    this.#random = options.random ?? Math.random;
    this.#now = options.now ?? (() => performance.now());
    this.#reduced = options.reducedMotion ?? false;

    this.#sim = forceSimulation<LayoutNode, LayoutLink>()
      .randomSource(this.#random)
      .force(
        'charge',
        forceManyBody<LayoutNode>().strength(FORCES.charge).distanceMax(FORCES.chargeDistanceMax),
      )
      .force(
        'link',
        forceLink<LayoutNode, LayoutLink>()
          .id((d) => d.id)
          .distance((l) => FORCES.linkDistance(l.source.degree, l.target.degree))
          .strength(FORCES.linkStrength),
      )
      .force('collide', forceCollide<LayoutNode>((d) => d.radius + FORCES.collidePadding).iterations(2))
      .force('center', forceCenter(0, 0).strength(FORCES.centerStrength))
      .force('x', forceX<LayoutNode>(0).strength(FORCES.axisStrength))
      .force('y', forceY<LayoutNode>(0).strength(FORCES.axisStrength))
      .alphaDecay(FORCES.alphaDecay)
      .stop();
  }

  // ---------- reading ----------

  get visible(): ReadonlySet<string> {
    return new Set(this.#nodes.keys());
  }

  has(id: string): boolean {
    return this.#nodes.has(id);
  }

  get(id: string): LayoutNode | undefined {
    return this.#nodes.get(id);
  }

  nodes(): readonly LayoutNode[] {
    return this.#sim.nodes();
  }

  links(): readonly LayoutLink[] {
    return this.#links;
  }

  /** Neighbours of `id` that are not on the map yet: the badge number. */
  hiddenNeighbours(id: string): string[] {
    return this.#graph
      .neighbours(id)
      .map((n) => n.id)
      .filter((n) => !this.#nodes.has(n));
  }

  /** Same as hiddenNeighbours(id).length without allocating: called per node per frame. */
  hiddenCount(id: string): number {
    let count = 0;
    for (const n of this.#graph.neighbours(id)) if (!this.#nodes.has(n.id)) count++;
    return count;
  }

  /** True while the simulation still moves nodes. */
  get active(): boolean {
    return this.#sim.alpha() > this.#sim.alphaMin();
  }

  /** Nearest node within `radius` of a world point, or undefined. */
  find(x: number, y: number, radius: number): LayoutNode | undefined {
    return this.#sim.find(x, y, radius);
  }

  // ---------- changing ----------

  /**
   * Seed nodes with no anchor: placed near the origin with jitter, popping in together.
   * Used for the start view and for "unfold everything".
   */
  addLoose(ids: readonly string[], options: { stagger?: boolean } = {}): void {
    const now = this.#now();
    let i = 0;
    for (const id of ids) {
      if (this.#nodes.has(id) || !this.#graph.has(id)) continue;
      const born = options.stagger ? now + (i % 40) * MOTION.staggerMs : now;
      this.#create(id, (this.#random() - 0.5) * 40, (this.#random() - 0.5) * 40, born);
      i++;
    }
    this.#rebuild();
  }

  /**
   * Unfold: place `ids` on a ring around `anchorId`, starting at a random angle, popping in one after another.
   * The anchor is pinned briefly so the children burst out of a still parent.
   */
  addAround(ids: readonly string[], anchorId: string): void {
    const anchor = this.#nodes.get(anchorId);
    const fresh = ids.filter((id) => !this.#nodes.has(id) && this.#graph.has(id));
    if (!anchor || fresh.length === 0) return;

    const now = this.#now();
    const base = this.#random() * Math.PI * 2;
    const ring = FORCES.ringRadius(fresh.length);
    fresh.forEach((id, i) => {
      const angle = base + (i / fresh.length) * Math.PI * 2;
      this.#create(
        id,
        anchor.x + Math.cos(angle) * ring,
        anchor.y + Math.sin(angle) * ring,
        now + i * MOTION.staggerMs,
      );
    });
    this.pinFor(anchorId, MOTION.anchorMs);
    this.#rebuild();
  }

  /** Reveal one node next to another (route hops, search jumps, card links). */
  reveal(id: string, nearId?: string): void {
    if (this.#nodes.has(id) || !this.#graph.has(id)) return;
    const near = nearId === undefined ? undefined : this.#nodes.get(nearId);
    const j = () => (this.#random() - 0.5) * FORCES.revealJitter;
    this.#create(id, (near?.x ?? 0) + j(), (near?.y ?? 0) + j(), this.#now());
    this.#rebuild();
  }

  /** Reveal several in order, each next to the previous one: a route appears as a chain. */
  revealChain(ids: readonly string[]): void {
    let previous: string | undefined;
    const now = this.#now();
    for (const id of ids) {
      if (!this.#nodes.has(id) && this.#graph.has(id)) {
        const near = previous === undefined ? undefined : this.#nodes.get(previous);
        const j = () => (this.#random() - 0.5) * FORCES.revealJitter;
        this.#create(id, (near?.x ?? 0) + j(), (near?.y ?? 0) + j(), now);
      }
      previous = id;
    }
    this.#rebuild();
  }

  remove(ids: Iterable<string>): void {
    let changed = false;
    for (const id of ids) changed = this.#nodes.delete(id) || changed;
    if (changed) this.#rebuild();
  }

  /**
   * Fold: the neighbours of `id` that would be left dangling without it.
   * A neighbour stays if it is protected (a seed) or still linked to another visible node.
   */
  foldable(id: string, protectedIds: ReadonlySet<string>): string[] {
    return this.#graph
      .neighbours(id)
      .map((n) => n.id)
      .filter(
        (m) =>
          this.#nodes.has(m) &&
          !protectedIds.has(m) &&
          !this.#graph.neighbours(m).some((x) => x.id !== id && this.#nodes.has(x.id)),
      );
  }

  clear(): void {
    this.#nodes.clear();
    this.#linkBorn.clear();
    this.#rebuild();
  }

  pin(id: string, x?: number, y?: number): void {
    const n = this.#nodes.get(id);
    if (!n) return;
    n.fx = x ?? n.x;
    n.fy = y ?? n.y;
  }

  unpin(id: string): void {
    const n = this.#nodes.get(id);
    if (!n) return;
    n.fx = null;
    n.fy = null;
  }

  pinFor(id: string, ms: number): void {
    this.pin(id);
    const t = setTimeout(() => {
      this.#timers.delete(t);
      this.unpin(id);
    }, ms);
    this.#timers.add(t);
  }

  // Dragging keeps the simulation warm so neighbours follow the hand.
  dragStart(id: string): void {
    this.#sim.alphaTarget(FORCES.dragAlphaTarget);
    this.reheat(Math.max(this.#sim.alpha(), FORCES.dragAlphaTarget));
    this.pin(id);
  }

  dragTo(id: string, x: number, y: number): void {
    this.pin(id, x, y);
  }

  dragEnd(id: string): void {
    this.#sim.alphaTarget(0);
    this.unpin(id);
  }

  reheat(alpha = 1): void {
    this.#sim.alpha(alpha);
  }

  /** Advance one tick if still moving. Returns whether anything moved, so the renderer knows to draw. */
  step(): boolean {
    if (!this.active) return false;
    this.#sim.tick();
    return true;
  }

  destroy(): void {
    for (const t of this.#timers) clearTimeout(t);
    this.#timers.clear();
    this.#sim.stop();
  }

  // ---------- internals ----------

  #create(id: string, x: number, y: number, born: number): void {
    const degree = this.#graph.degree(id);
    this.#nodes.set(id, { id, degree, radius: nodeRadius(degree), born, x, y, vx: 0, vy: 0 });
  }

  #rebuild(): void {
    const now = this.#now();
    this.#sim.nodes([...this.#nodes.values()]);

    const links: LayoutLink[] = [];
    const keep = new Set<string>();
    for (const { from, to, relation } of this.#graph.edges) {
      const source = this.#nodes.get(from);
      const target = this.#nodes.get(to);
      if (!source || !target) continue;
      const key = `${from}|${to}`;
      keep.add(key);
      // An edge starts growing once its younger end has started popping in.
      if (!this.#linkBorn.has(key)) this.#linkBorn.set(key, Math.max(source.born, target.born, now));
      links.push({ key, source, target, relation, born: this.#linkBorn.get(key) ?? now });
    }
    for (const key of this.#linkBorn.keys()) if (!keep.has(key)) this.#linkBorn.delete(key);
    this.#links = links;

    // d3 resolves link ends by id only when given strings; ours are already objects.
    this.#sim.force<ReturnType<typeof forceLink<LayoutNode, LayoutLink>>>('link')?.links(links);

    if (this.#reduced) {
      this.#sim.alpha(0.3);
      this.#sim.tick(FORCES.settleTicks);
      this.#sim.alpha(0);
    } else {
      this.reheat(1);
    }
  }
}
