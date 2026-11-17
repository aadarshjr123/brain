import type { Graph } from './graph.ts';
import type { Layout, LayoutLink, LayoutNode } from './layout.ts';
import { MOTION, backOut, clamp01, easeOut } from './motion.ts';

/** Colours read from CSS tokens by the app, so the canvas follows the theme. */
export interface Palette {
  bg: string;
  fg: string;
  muted: string;
  lineStrong: string;
  accent: string;
  accentInk: string;
  surfaceSolid: string;
  domains: Readonly<Record<string, string>>;
}

export interface Fonts {
  sans: string;
  mono: string;
}

/** What to draw, beyond positions. The app's store provides it; the renderer only reads. */
export interface Scene {
  selectedId: string | null;
  hoverId: string | null;
  /** Explore focus: dims everything that is not the selection or its neighbours. */
  focus: boolean;
  route: { path: readonly string[]; startedAt: number } | null;
  routeFrom: string | null;
  routeTo: string | null;
  activeDomains: ReadonlySet<string>;
}

export interface Transform {
  x: number;
  y: number;
  k: number;
}

export interface CanvasLike {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasRenderingContext2D | null;
}

/** Injected so tests can drive frames by hand. Defaults to the browser's rAF and visibility. */
export interface Scheduler {
  request(cb: (now: number) => void): number;
  cancel(handle: number): void;
  isHidden(): boolean;
}

export interface ConceptLike {
  id: string;
  label: string;
  domain: string;
}

export interface RendererOptions<N extends ConceptLike> {
  canvas: CanvasLike;
  graph: Graph<N>;
  layout: Layout;
  scene: () => Scene;
  palette: Palette;
  fonts: Fonts;
  reducedMotion?: boolean;
  scheduler?: Scheduler;
  /** Called when the route pulse reaches a new hop (not per frame), so a card can follow the map. */
  onHop?: (hop: number) => void;
  /** Hub cut-off for mid-zoom labels. Defaults to the 85th percentile of degree in the graph. */
  hubDegree?: number;
}

/**
 * Mockup v3 labelled nodes with degree > 10 at mid zoom, but no concept has more than 10 neighbours, so
 * nothing was labelled. A percentile keeps "hub" meaningful as content grows.
 */
export function hubThreshold(degrees: readonly number[], percentile = 0.85): number {
  if (degrees.length === 0) return Infinity;
  const sorted = [...degrees].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor(percentile * sorted.length))] ?? Infinity;
}

const browserScheduler: Scheduler = {
  request: (cb) => requestAnimationFrame(cb),
  cancel: (h) => {
    cancelAnimationFrame(h);
  },
  isHidden: () => typeof document !== 'undefined' && document.hidden,
};

/**
 * Canvas 2D renderer for the map (ADR-0003). Ported from mockup v3's draw().
 *
 * Demand-driven: a frame is scheduled only when something changed (`invalidate`), the layout is moving,
 * or an animation clock is running. An idle map costs no CPU, and a hidden tab draws nothing.
 * React never sits in this loop.
 */
export class Renderer<N extends ConceptLike> {
  readonly #canvas: CanvasLike;
  readonly #ctx: CanvasRenderingContext2D;
  readonly #graph: Graph<N>;
  readonly #layout: Layout;
  readonly #scene: () => Scene;
  readonly #scheduler: Scheduler;
  readonly #onHop: ((hop: number) => void) | undefined;
  #palette: Palette;
  #fonts: Fonts;
  #reduced: boolean;

  #width = 0;
  #height = 0;
  #dpr = 1;
  #transform: Transform = { x: 0, y: 0, k: 1 };
  #dirty = true;
  #handle: number | null = null;
  #running = false;
  #lastHop = -1;
  /** Degree from which a node counts as a hub and keeps its label at mid zoom. */
  readonly #hubDegree: number;
  /** Frames actually drawn; tests and the perf overlay read it. */
  framesDrawn = 0;

  constructor(options: RendererOptions<N>) {
    const ctx = options.canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.#canvas = options.canvas;
    this.#ctx = ctx;
    this.#graph = options.graph;
    this.#layout = options.layout;
    this.#scene = options.scene;
    this.#palette = options.palette;
    this.#fonts = options.fonts;
    this.#reduced = options.reducedMotion ?? false;
    this.#scheduler = options.scheduler ?? browserScheduler;
    this.#onHop = options.onHop;
    this.#hubDegree =
      options.hubDegree ??
      hubThreshold([...options.graph.nodes.keys()].map((id) => options.graph.degree(id)));
  }

  // ---------- configuration ----------

  resize(width: number, height: number, devicePixelRatio: number): void {
    this.#dpr = Math.min(devicePixelRatio || 1, 2);
    this.#width = width;
    this.#height = height;
    this.#canvas.width = Math.round(width * this.#dpr);
    this.#canvas.height = Math.round(height * this.#dpr);
    this.invalidate();
  }

  setTransform(transform: Transform): void {
    this.#transform = transform;
    this.invalidate();
  }

  get transform(): Transform {
    return this.#transform;
  }

  get size(): { width: number; height: number } {
    return { width: this.#width, height: this.#height };
  }

  setPalette(palette: Palette, fonts?: Fonts): void {
    this.#palette = palette;
    if (fonts) this.#fonts = fonts;
    this.invalidate();
  }

  setReducedMotion(reduced: boolean): void {
    this.#reduced = reduced;
    this.invalidate();
  }

  /** Restart the route clock without recomputing the path (Replay). */
  resetHop(): void {
    this.#lastHop = -1;
  }

  toWorld(px: number, py: number): [number, number] {
    const { x, y, k } = this.#transform;
    return [(px - x) / k, (py - y) / k];
  }

  /** Node under a screen point, with a touch-friendly radius that stays constant on screen. */
  hit(px: number, py: number): LayoutNode | undefined {
    const [x, y] = this.toWorld(px, py);
    return this.#layout.find(x, y, 22 / this.#transform.k + 8);
  }

  // ---------- loop ----------

  start(): void {
    this.#running = true;
    this.invalidate();
  }

  stop(): void {
    this.#running = false;
    if (this.#handle !== null) this.#scheduler.cancel(this.#handle);
    this.#handle = null;
  }

  /** Mark the picture stale and make sure a frame is coming. */
  invalidate(): void {
    this.#dirty = true;
    this.#schedule();
  }

  #schedule(): void {
    if (!this.#running || this.#handle !== null) return;
    this.#handle = this.#scheduler.request((now) => {
      this.#handle = null;
      if (this.#scheduler.isHidden()) return; // resumes on the next invalidate (visibilitychange)
      if (this.frame(now)) this.#schedule();
    });
  }

  /**
   * One tick: advance the layout, draw if anything changed. Returns whether another frame is needed.
   * Public so tests (and a future worker) can drive it without rAF.
   */
  frame(now: number): boolean {
    const moved = this.#layout.step();
    const animating = this.#isAnimating(now);
    if (moved || animating || this.#dirty) {
      this.#dirty = false;
      this.draw(now);
    }
    return moved || animating;
  }

  #isAnimating(now: number): boolean {
    if (this.#reduced) return false;
    const scene = this.#scene();
    if (scene.route && scene.route.path.length > 1) return true; // the pulse loops
    if (scene.selectedId !== null || scene.hoverId !== null || scene.routeFrom !== null) return true; // the halo breathes
    const settleAt = Math.max(MOTION.popMs, MOTION.edgeGrowMs);
    for (const n of this.#layout.nodes()) if (now < n.born + settleAt) return true;
    for (const l of this.#layout.links()) if (now < l.born + MOTION.edgeGrowMs) return true;
    return false;
  }

  // ---------- drawing ----------

  #nodeScale(n: LayoutNode, now: number): number {
    if (this.#reduced) return 1;
    const t = (now - n.born) / MOTION.popMs;
    return t <= 0 ? 0 : t >= 1 ? 1 : backOut(t);
  }

  #domainOf(id: string): string {
    return this.#graph.nodes.get(id)?.domain ?? '';
  }

  #colour(id: string): string {
    return this.#palette.domains[this.#domainOf(id)] ?? this.#palette.fg;
  }

  draw(now: number): void {
    this.framesDrawn++;
    const ctx = this.#ctx;
    const p = this.#palette;
    const { x: tx, y: ty, k } = this.#transform;
    const scene = this.#scene();

    ctx.setTransform(this.#dpr, 0, 0, this.#dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.fillStyle = p.bg;
    ctx.fillRect(0, 0, this.#width, this.#height);

    this.#drawGrid(k);

    ctx.translate(tx, ty);
    ctx.scale(k, k);
    ctx.lineCap = 'round';

    const path = scene.route?.path ?? null;
    const onPath = new Set(path ?? []);
    const pathEdges = new Set<string>();
    if (path) {
      for (let i = 1; i < path.length; i++) {
        pathEdges.add(`${path[i - 1] ?? ''}|${path[i] ?? ''}`);
        pathEdges.add(`${path[i] ?? ''}|${path[i - 1] ?? ''}`);
      }
    }
    const focusId = scene.focus ? scene.selectedId : null;
    const neighbours = focusId ? new Set(this.#graph.neighbours(focusId).map((n) => n.id)) : null;
    const active = scene.activeDomains;

    // ---- edges
    for (const l of this.#layout.links()) {
      if (pathEdges.has(l.key)) continue; // drawn with the route
      this.#drawEdge(l, now, k, path !== null, focusId, active);
    }

    // ---- route: progressive draw and travelling pulse
    if (path && path.length > 1 && scene.route) this.#drawRoute(path, now - scene.route.startedAt, k);

    // ---- nodes
    for (const n of this.#layout.nodes()) {
      const scale = this.#nodeScale(n, now);
      if (scale <= 0) continue;
      const domain = this.#domainOf(n.id);
      const isSel = n.id === scene.selectedId;
      const isHover = n.id === scene.hoverId;
      const inPath = onPath.has(n.id);
      const isEnd = n.id === scene.routeFrom || n.id === scene.routeTo;
      const isNb = neighbours?.has(n.id) ?? false;
      const dim =
        (path !== null && !inPath) || (focusId !== null && n.id !== focusId && !isNb) || !active.has(domain);
      this.#drawNode(n, now, k, scale, {
        isSel,
        isHover,
        inPath,
        isEnd,
        isNb,
        dim,
        focused: focusId !== null,
        hasRoute: path !== null,
      });
    }
    ctx.globalAlpha = 1;
  }

  #drawGrid(k: number): void {
    if (k <= 0.45) return;
    const ctx = this.#ctx;
    const step = 60;
    const [x0, y0] = this.toWorld(0, 0);
    const [x1, y1] = this.toWorld(this.#width, this.#height);
    const { x: tx, y: ty } = this.#transform;
    ctx.fillStyle = this.#palette.lineStrong;
    ctx.globalAlpha = Math.min(0.55, k - 0.45);
    for (let x = Math.floor(x0 / step) * step; x < x1; x += step) {
      for (let y = Math.floor(y0 / step) * step; y < y1; y += step) {
        ctx.fillRect(x * k + tx - 0.5, y * k + ty - 0.5, 1, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  #drawEdge(
    l: LayoutLink,
    now: number,
    k: number,
    hasRoute: boolean,
    focusId: string | null,
    active: ReadonlySet<string>,
  ): void {
    const ctx = this.#ctx;
    const { source, target } = l;
    const isFocus = focusId !== null && (source.id === focusId || target.id === focusId);
    const dim =
      hasRoute ||
      (focusId !== null && !isFocus) ||
      !active.has(this.#domainOf(source.id)) ||
      !active.has(this.#domainOf(target.id));
    const grow = this.#reduced ? 1 : clamp01((now - l.born) / MOTION.edgeGrowMs);
    // Grow from the end that has already appeared.
    const s = this.#nodeScale(source, now) > 0 ? source : target;
    const t = s === source ? target : source;
    const e = easeOut(grow);

    ctx.strokeStyle = isFocus
      ? this.#colour(source.id === focusId ? target.id : source.id)
      : this.#palette.lineStrong;
    ctx.globalAlpha = dim ? 0.08 : isFocus ? 0.95 : 0.5;
    ctx.lineWidth = (isFocus ? 1.6 : 1) / k;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x + (t.x - s.x) * e, s.y + (t.y - s.y) * e);
    ctx.stroke();
    if (isFocus && k > 0.6 && grow >= 1) this.#edgeLabel(source, target, l.relation, this.#palette.muted, k);
  }

  #drawRoute(path: readonly string[], elapsed: number, k: number): void {
    const ctx = this.#ctx;
    const p = this.#palette;
    const segs = path.length - 1;
    const phase = this.#reduced ? segs : elapsed / MOTION.hopMs;
    const drawn = Math.min(segs, phase);
    const at = (i: number) => this.#layout.get(path[i] ?? '');

    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2.6 / k;
    ctx.globalAlpha = 1;
    ctx.shadowColor = p.accent;
    ctx.shadowBlur = 12 / k;
    for (let i = 0; i < segs; i++) {
      const a = at(i);
      const b = at(i + 1);
      const f = clamp01(drawn - i);
      if (f <= 0 || !a || !b) break;
      const e = easeOut(f);
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(a.x + (b.x - a.x) * e, a.y + (b.y - a.y) * e);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;

    if (k > 0.6) {
      for (let i = 0; i < Math.floor(drawn); i++) {
        const a = at(i);
        const b = at(i + 1);
        if (!a || !b) continue;
        const rel = this.#graph.relationBetween(a.id, b.id);
        const text = rel ? (rel.direction === 'out' ? rel.relation : `← ${rel.relation}`) : '';
        this.#edgeLabel(a, b, text, p.accent, k);
      }
    }

    // Pulse: rides the drawing edge first, then loops slower along the whole route.
    const pos =
      phase < segs ? phase : this.#reduced ? segs - 0.0001 : ((phase - segs) * MOTION.pulseLoopRate) % segs;
    const i = Math.floor(pos);
    const f = pos - i;
    const a = at(i);
    const b = at(Math.min(i + 1, segs));
    if (a && b) {
      const e = easeOut(f);
      const px = a.x + (b.x - a.x) * e;
      const py = a.y + (b.y - a.y) * e;
      const g = ctx.createRadialGradient(px, py, 0, px, py, 16 / k);
      g.addColorStop(0, p.accent);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = 0.9;
      ctx.beginPath();
      ctx.arc(px, py, 16 / k, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.fillStyle = p.fg;
      ctx.beginPath();
      ctx.arc(px, py, 3.5 / k, 0, Math.PI * 2);
      ctx.fill();
    }

    const hop = phase < segs ? Math.floor(phase) : i + (f > 0.5 ? 1 : 0);
    if (hop !== this.#lastHop) {
      this.#lastHop = hop;
      this.#onHop?.(hop);
    }
  }

  #drawNode(
    n: LayoutNode,
    now: number,
    k: number,
    scale: number,
    s: {
      isSel: boolean;
      isHover: boolean;
      inPath: boolean;
      isEnd: boolean;
      isNb: boolean;
      dim: boolean;
      focused: boolean;
      hasRoute: boolean;
    },
  ): void {
    const ctx = this.#ctx;
    const p = this.#palette;
    const r = n.radius * scale;
    const c = this.#colour(n.id);
    ctx.globalAlpha = s.dim ? 0.16 : 1;

    // Halo: selection, hover, route.
    if (s.isSel || s.isHover || s.inPath || s.isEnd) {
      const breathe = this.#reduced ? 0 : Math.sin(now * MOTION.breatheRate) * MOTION.breatheAmp;
      const hr = r + 7 / k + breathe;
      const col = s.inPath || s.isEnd ? p.accent : c;
      const g = ctx.createRadialGradient(n.x, n.y, r, n.x, n.y, hr + 10 / k);
      g.addColorStop(0, col);
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.globalAlpha = s.dim ? 0.1 : 0.35;
      ctx.beginPath();
      ctx.arc(n.x, n.y, hr + 10 / k, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = s.dim ? 0.16 : 1;
      ctx.beginPath();
      ctx.arc(n.x, n.y, hr, 0, Math.PI * 2);
      ctx.strokeStyle = col;
      ctx.lineWidth = 1.5 / k;
      ctx.stroke();
    }

    // Body: ring and core.
    ctx.beginPath();
    ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
    ctx.fillStyle = p.surfaceSolid;
    ctx.fill();
    ctx.strokeStyle = c;
    ctx.lineWidth = 2 / k;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(n.x, n.y, Math.max(1.5, r * 0.5), 0, Math.PI * 2);
    ctx.fillStyle = c;
    ctx.fill();

    // Badge: how many neighbours are still folded.
    const hidden = this.#layout.hiddenCount(n.id);
    if (hidden > 0 && !s.hasRoute && scale >= 1) {
      const bx = n.x + r * 0.8;
      const by = n.y - r * 0.8;
      const bk = Math.max(k, 0.8);
      ctx.beginPath();
      ctx.arc(bx, by, 6.5 / bk, 0, Math.PI * 2);
      ctx.fillStyle = c;
      ctx.fill();
      ctx.fillStyle = p.accentInk;
      ctx.font = `600 ${String(8.5 / bk)}px ${this.#fonts.mono}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(hidden), bx, by + 0.5 / k);
    }

    // Label: always for the important ones; by zoom level otherwise.
    const showLabel =
      s.isSel ||
      s.isHover ||
      s.inPath ||
      s.isNb ||
      (s.focused ? false : k > 0.9 || (k > 0.55 && n.degree >= this.#hubDegree));
    if (showLabel && scale > 0.6) {
      const label = this.#graph.nodes.get(n.id)?.label ?? n.id;
      const fs = 12 / Math.max(k, 0.9);
      ctx.font = `${s.isSel || s.inPath ? '600' : '500'} ${String(fs)}px ${this.#fonts.sans}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      const lw = ctx.measureText(label).width;
      ctx.fillStyle = p.bg;
      ctx.globalAlpha = s.dim ? 0.2 : 0.75;
      this.#roundRect(n.x - lw / 2 - 5 / k, n.y + r + 3 / k, lw + 10 / k, fs + 6 / k, 4 / k);
      ctx.fill();
      ctx.globalAlpha = s.dim ? 0.3 : 1;
      ctx.fillStyle = p.fg;
      ctx.fillText(label, n.x, n.y + r + 6 / k);
    }
  }

  #roundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.#ctx;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }

  #edgeLabel(a: LayoutNode, b: LayoutNode, text: string, colour: string, k: number): void {
    const ctx = this.#ctx;
    ctx.save();
    ctx.globalAlpha = 1;
    const fs = 10 / k;
    ctx.font = `${String(fs)}px ${this.#fonts.mono}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let angle = Math.atan2(b.y - a.y, b.x - a.x);
    if (angle > Math.PI / 2 || angle < -Math.PI / 2) angle += Math.PI; // keep text upright
    ctx.translate((a.x + b.x) / 2, (a.y + b.y) / 2);
    ctx.rotate(angle);
    const w = ctx.measureText(text).width + 10 / k;
    ctx.fillStyle = this.#palette.bg;
    ctx.globalAlpha = 0.9;
    this.#roundRect(-w / 2, -fs * 0.8, w, fs * 1.6, 3 / k);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = colour;
    ctx.fillText(text, 0, 0);
    ctx.restore();
  }
}
