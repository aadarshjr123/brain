import type { ConceptNode, ContentGraph } from '@brain/content';
import {
  CAMERA,
  type Graph,
  Layout,
  MOTION,
  Renderer,
  type Scene,
  type Transform,
  buildGraph,
  centerOn,
  fitBounds,
} from '@brain/graph-engine';
import { type D3DragEvent, drag } from 'd3-drag';
import { select } from 'd3-selection';
import 'd3-transition';
import { type ZoomBehavior, zoom, zoomIdentity } from 'd3-zoom';

import { EXPLORE } from './config';
import { readFonts, readPalette } from './palette';
import { type SearchIndex, createSearchIndex } from './search';
import { type ExploreStore, createExploreStore } from './store';
import { type UrlState, parseUrlState, serialiseUrlState } from './url-state';

export interface ControllerOptions {
  content: ContentGraph;
  reducedMotion?: boolean;
  random?: () => number;
  now?: () => number;
}

/**
 * The map's brain. Owns the engine (Layout + Renderer), wires pointer, zoom and drag on the canvas,
 * and writes the outcome to the Zustand store. React components call its methods and read the store;
 * they never touch the engine. Everything but `attach` works without a DOM, which is how it is tested.
 */
export class ExploreController {
  readonly graph: Graph<ConceptNode>;
  readonly store: ExploreStore;
  readonly domains: readonly string[];
  readonly #domainNames: ReadonlyMap<string, string>;
  readonly layout: Layout;
  readonly search: SearchIndex;
  #reduced: boolean;
  #now: () => number;
  #renderer: Renderer<ConceptNode> | null = null;
  #canvas: HTMLCanvasElement | null = null;
  #zoom: ZoomBehavior<HTMLCanvasElement, unknown> | null = null;
  #detach: (() => void)[] = [];

  constructor({ content, reducedMotion = false, random, now }: ControllerOptions) {
    this.graph = buildGraph(content.nodes, content.edges);
    this.domains = content.domains.map((d) => d.id);
    this.#domainNames = new Map(content.domains.map((d) => [d.id, d.name]));
    this.search = createSearchIndex(content.nodes, (id) => this.graph.degree(id));
    this.store = createExploreStore(this.domains);
    this.#reduced = reducedMotion;
    this.#now = now ?? (() => performance.now());
    this.layout = new Layout(this.graph, {
      reducedMotion,
      now: this.#now,
      ...(random ? { random } : {}),
    });
    this.layout.addLoose(EXPLORE.seeds);
    this.#sync();
  }

  // ---------------- reading ----------------

  concept(id: string): ConceptNode | undefined {
    return this.graph.nodes.get(id);
  }

  domainName(domain: string): string {
    return this.#domainNames.get(domain) ?? domain;
  }

  hiddenCount(id: string): number {
    return this.layout.hiddenCount(id);
  }

  /** Where a concept is drawn, in canvas pixels; null if not visible or not mounted. */
  screenPoint(id: string): { x: number; y: number } | null {
    const n = this.layout.get(id);
    const t = this.#renderer?.transform;
    if (!n || !t) return null;
    return { x: n.x * t.k + t.x, y: n.y * t.k + t.y };
  }

  /** True once the layout has come to rest; e2e waits on it before clicking. */
  get settled(): boolean {
    return !this.layout.active;
  }

  /** The renderer's view of the store, read once per frame. */
  scene = (): Scene => {
    const s = this.store.getState();
    return {
      selectedId: s.selectedId,
      hoverId: s.hoverId,
      focus: s.mode === 'explore' && s.selectedId !== null,
      route: s.route.path ? { path: s.route.path, startedAt: s.route.startedAt } : null,
      routeFrom: s.route.from,
      routeTo: s.route.to,
      activeDomains: s.activeDomains,
    };
  };

  // ---------------- explore actions ----------------

  /** Click in explore mode: unfold one page of hidden neighbours, then select. */
  open(id: string): void {
    this.unfold(id);
    this.select(id);
  }

  select(id: string | null): void {
    this.store.getState().select(id);
    this.#invalidate();
  }

  /** Reveals up to one page of hidden neighbours on a ring. Returns how many appeared. */
  unfold(id: string): number {
    if (!this.layout.has(id)) this.layout.reveal(id);
    const page = this.layout.hiddenNeighbours(id).slice(0, EXPLORE.unfoldPage);
    if (page.length) this.layout.addAround(page, id);
    this.#sync();
    return page.length;
  }

  fold(id: string): number {
    const gone = this.layout.foldable(id, new Set(EXPLORE.seeds));
    this.layout.remove(gone);
    const { selectedId } = this.store.getState();
    if (selectedId !== null && gone.includes(selectedId)) this.select(null);
    this.#sync();
    return gone.length;
  }

  /** Make a concept visible next to another (card links, search, deep links). */
  reveal(id: string, nearId?: string | null): void {
    if (this.layout.has(id)) return;
    this.layout.reveal(id, nearId ?? this.store.getState().selectedId ?? undefined);
    this.#sync();
  }

  /** Jump from search or a card link: reveal, open, and bring into view. */
  jump(id: string): void {
    if (!this.graph.has(id)) return;
    this.reveal(id);
    this.open(id);
    // Let the pop-in start before moving the camera, as in the mockup.
    setTimeout(
      () => {
        this.center(id);
      },
      this.#reduced ? 0 : 350,
    );
  }

  unfoldAll(): void {
    const hidden = [...this.graph.nodes.keys()].filter((id) => !this.layout.has(id));
    this.layout.addLoose(hidden, { stagger: true });
    this.#sync();
    this.fit();
  }

  reset(): void {
    const s = this.store.getState();
    this.layout.clear();
    this.layout.addLoose(EXPLORE.seeds);
    s.select(null);
    s.clearTrail();
    s.setMode('explore');
    s.setDomains(this.domains);
    this.#sync();
    this.#animateTo(this.#home(), MOTION.resetMs);
  }

  toggleDomain(domain: string): void {
    this.store.getState().toggleDomain(domain);
    this.#invalidate();
  }

  // ---------------- camera ----------------

  zoomBy(factor: number): void {
    if (!this.#canvas || !this.#zoom) return;
    const zoomer = this.#zoom;
    select(this.#canvas)
      .transition()
      .duration(this.#ms(MOTION.zoomStepMs))
      .call((t) => {
        zoomer.scaleBy(t, factor);
      });
  }

  zoomIn(): void {
    this.zoomBy(CAMERA.zoomStep);
  }

  zoomOut(): void {
    this.zoomBy(1 / CAMERA.zoomStep);
  }

  center(id: string): void {
    const n = this.layout.get(id);
    if (!n || !this.#renderer) return;
    this.#animateTo(centerOn(n, this.#renderer.size, this.#renderer.transform.k), MOTION.centerMs);
  }

  /** Fit all visible nodes, or the given ones, after the layout has had a moment to spread. */
  fit(ids?: readonly string[]): void {
    setTimeout(
      () => {
        if (!this.#renderer) return;
        const nodes = ids
          ? ids.map((id) => this.layout.get(id)).filter((n) => n !== undefined)
          : this.layout.nodes();
        const t = fitBounds(nodes, this.#renderer.size);
        if (t) this.#animateTo(t, MOTION.fitMs);
      },
      this.#reduced ? 0 : MOTION.fitDelayMs,
    );
  }

  // ---------------- links ----------------

  /** Restore a shared link: layers first, then the selected concept. Unknown values were dropped by the parser. */
  applyUrlState(state: UrlState): void {
    if (state.layers) this.store.getState().setDomains(state.layers);
    if (state.n) {
      this.reveal(state.n);
      this.open(state.n);
    }
  }

  /** The part of the state worth putting in a link. */
  urlState(): UrlState {
    const s = this.store.getState();
    const state: UrlState = {};
    if (s.selectedId) state.n = s.selectedId;
    if (s.activeDomains.size < this.domains.length) state.layers = [...s.activeDomains];
    return state;
  }

  parseUrl(search: string): UrlState {
    return parseUrlState(search, {
      concept: (id) => this.graph.has(id),
      domain: (d) => this.domains.includes(d),
    });
  }

  serialiseUrl(state: UrlState = this.urlState()): string {
    return serialiseUrlState(state, this.domains);
  }

  // ---------------- DOM wiring ----------------

  /** Mounts the renderer on a canvas and wires gestures. Returns a cleanup function. */
  attach(canvas: HTMLCanvasElement): () => void {
    this.#canvas = canvas;
    const root = document.documentElement;
    const renderer = new Renderer<ConceptNode>({
      canvas,
      graph: this.graph,
      layout: this.layout,
      scene: this.scene,
      palette: readPalette(root, this.domains),
      fonts: readFonts(root),
      reducedMotion: this.#reduced,
      onHop: (hop) => {
        this.store.getState().setHop(hop);
      },
    });
    this.#renderer = renderer;

    // Size
    const resize = () => {
      renderer.resize(canvas.clientWidth, canvas.clientHeight, window.devicePixelRatio);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
    resize();

    // Drag nodes. Registered before zoom: on a node it stops the event, so the map does not pan.
    const selection = select(canvas);
    selection.call(
      drag<HTMLCanvasElement, unknown, { id: string } | undefined>()
        .container(canvas)
        .subject((event: D3DragEvent<HTMLCanvasElement, unknown, unknown>) => renderer.hit(event.x, event.y))
        .on('start', (event: D3DragEvent<HTMLCanvasElement, unknown, { id: string }>) => {
          canvas.dataset.dragging = 'true';
          this.layout.dragStart(event.subject.id);
          renderer.invalidate();
        })
        .on('drag', (event: D3DragEvent<HTMLCanvasElement, unknown, { id: string }>) => {
          const [x, y] = renderer.toWorld(event.x, event.y);
          this.layout.dragTo(event.subject.id, x, y);
          renderer.invalidate();
        })
        .on('end', (event: D3DragEvent<HTMLCanvasElement, unknown, { id: string }>) => {
          delete canvas.dataset.dragging;
          this.layout.dragEnd(event.subject.id);
          renderer.invalidate();
        }),
    );

    // Pan and zoom.
    const zoomer = zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([CAMERA.minZoom, CAMERA.maxZoom])
      .on('zoom', (event: { transform: Transform }) => {
        renderer.setTransform({ x: event.transform.x, y: event.transform.y, k: event.transform.k });
      });
    this.#zoom = zoomer;
    selection.call(zoomer).on('dblclick.zoom', null);
    const home = this.#home();
    zoomer.transform(selection, zoomIdentity.translate(home.x, home.y).scale(home.k));

    // Click (a press that did not move) and hover.
    let downAt: [number, number] | null = null;
    const local = (e: PointerEvent): [number, number] => {
      const r = canvas.getBoundingClientRect();
      return [e.clientX - r.left, e.clientY - r.top];
    };
    const onDown = (e: PointerEvent) => {
      downAt = [e.clientX, e.clientY];
    };
    const onUp = (e: PointerEvent) => {
      if (!downAt) return;
      const moved = Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]);
      downAt = null;
      if (moved > 5) return;
      const n = renderer.hit(...local(e));
      this.onCanvasClick(n?.id ?? null);
    };
    const onMove = (e: PointerEvent) => {
      const id = renderer.hit(...local(e))?.id ?? null;
      if (id !== this.store.getState().hoverId) {
        this.store.getState().hover(id);
        canvas.style.cursor = id ? 'pointer' : '';
        renderer.invalidate();
      }
    };
    const onLeave = () => {
      this.store.getState().hover(null);
      renderer.invalidate();
    };
    canvas.addEventListener('pointerdown', onDown);
    canvas.addEventListener('pointerup', onUp);
    canvas.addEventListener('pointermove', onMove);
    canvas.addEventListener('pointerleave', onLeave);

    // Theme, fonts, visibility, motion preference.
    const repaint = () => {
      renderer.setPalette(readPalette(root, this.domains), readFonts(root));
    };
    const scheme = matchMedia('(prefers-color-scheme: dark)');
    scheme.addEventListener('change', repaint);
    const themeObserver = new MutationObserver(repaint);
    themeObserver.observe(root, { attributes: true, attributeFilter: ['data-theme', 'class'] });
    void document.fonts.ready.then(repaint);
    const onVisible = () => {
      if (!document.hidden) renderer.invalidate();
    };
    document.addEventListener('visibilitychange', onVisible);

    // Store changes that affect the picture (selection from panels, layers, route) trigger a frame.
    const unsubscribe = this.store.subscribe(() => {
      renderer.invalidate();
    });

    // A shared link restores its state; the first view then centres on the linked concept or fits the seeds.
    this.applyUrlState(this.parseUrl(window.location.search));
    renderer.start();
    const firstFit = setTimeout(
      () => {
        const { selectedId } = this.store.getState();
        if (selectedId) this.center(selectedId);
        else this.fit();
      },
      this.#reduced ? 0 : EXPLORE.initialFitMs,
    );

    // Keep the address bar in step without adding history entries.
    let urlTimer: ReturnType<typeof setTimeout> | undefined;
    const unsubscribeUrl = this.store.subscribe((state, previous) => {
      if (state.selectedId === previous.selectedId && state.activeDomains === previous.activeDomains) return;
      clearTimeout(urlTimer);
      urlTimer = setTimeout(() => {
        const next = `${window.location.pathname}${this.serialiseUrl()}${window.location.hash}`;
        if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
          window.history.replaceState(window.history.state, '', next);
        }
      }, EXPLORE.urlDebounceMs);
    });

    this.#detach = [
      () => {
        clearTimeout(firstFit);
        clearTimeout(urlTimer);
      },
      unsubscribeUrl,
      () => {
        ro.disconnect();
      },
      () => {
        selection.on('.drag', null).on('.zoom', null);
      },
      () => {
        canvas.removeEventListener('pointerdown', onDown);
        canvas.removeEventListener('pointerup', onUp);
        canvas.removeEventListener('pointermove', onMove);
        canvas.removeEventListener('pointerleave', onLeave);
      },
      () => {
        scheme.removeEventListener('change', repaint);
        themeObserver.disconnect();
        document.removeEventListener('visibilitychange', onVisible);
      },
      unsubscribe,
      () => {
        renderer.stop();
      },
    ];
    return () => {
      this.detach();
    };
  }

  detach(): void {
    for (const fn of this.#detach) fn();
    this.#detach = [];
    this.#renderer = null;
    this.#canvas = null;
    this.#zoom = null;
  }

  destroy(): void {
    this.detach();
    this.layout.destroy();
  }

  /** Canvas click: on a node in explore mode it opens; on empty space it clears the selection. */
  onCanvasClick(id: string | null): void {
    if (id === null) {
      if (this.store.getState().mode === 'explore') this.select(null);
      return;
    }
    this.open(id);
  }

  // ---------------- internals ----------------

  #sync(): void {
    this.store.getState().setVisible(this.layout.visible);
    this.#invalidate();
  }

  #invalidate(): void {
    this.#renderer?.invalidate();
  }

  #home(): Transform {
    const size = this.#renderer?.size ?? { width: 0, height: 0 };
    return { x: size.width / 2, y: size.height / 2, k: 1 };
  }

  #ms(ms: number): number {
    return this.#reduced ? 0 : ms;
  }

  #animateTo(t: Transform, ms: number): void {
    if (!this.#canvas || !this.#zoom) return;
    const zoomer = this.#zoom;
    select(this.#canvas)
      .transition()
      .duration(this.#ms(ms))
      .call((tr) => {
        zoomer.transform(tr, zoomIdentity.translate(t.x, t.y).scale(t.k));
      });
  }
}
