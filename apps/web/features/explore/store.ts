import { createStore } from 'zustand/vanilla';

import { EXPLORE } from './config';

export type Mode = 'explore' | 'route';

export interface Toast {
  id: number;
  message: string;
}

export interface RouteState {
  from: string | null;
  to: string | null;
  /** null while picking, or when the two concepts are not connected. */
  path: readonly string[] | null;
  startedAt: number;
}

/**
 * Engine and view state for the map (ADR-0006: Zustand for per-frame and transient state).
 * The renderer reads it every frame through getState(); React panels subscribe with narrow selectors.
 * Every Set is replaced, never mutated, so selectors see a new reference on change.
 */
export interface ExploreState {
  mode: Mode;
  selectedId: string | null;
  hoverId: string | null;
  visible: ReadonlySet<string>;
  activeDomains: ReadonlySet<string>;
  trail: readonly string[];
  route: RouteState;
  /** Hop the route pulse is on; written by the renderer only when it changes. */
  hop: number;
  toast: Toast | null;
}

export interface ExploreActions {
  select(id: string | null): void;
  hover(id: string | null): void;
  setVisible(ids: ReadonlySet<string>): void;
  toggleDomain(domain: string): void;
  setDomains(domains: Iterable<string>): void;
  setMode(mode: Mode): void;
  setRoute(route: Partial<RouteState>): void;
  clearRoute(): void;
  setHop(hop: number): void;
  notify(message: string): void;
  dismissToast(): void;
  clearTrail(): void;
}

export type ExploreStore = ReturnType<typeof createExploreStore>;

const emptyRoute: RouteState = { from: null, to: null, path: null, startedAt: 0 };

export function pushTrail(trail: readonly string[], id: string, max: number = EXPLORE.trailLength): string[] {
  const next = trail.filter((x) => x !== id);
  next.push(id);
  return next.length > max ? next.slice(next.length - max) : next;
}

export function createExploreStore(domains: readonly string[]) {
  let toastId = 0;
  return createStore<ExploreState & ExploreActions>()((set, get) => ({
    mode: 'explore',
    selectedId: null,
    hoverId: null,
    visible: new Set(),
    activeDomains: new Set(domains),
    trail: [],
    route: emptyRoute,
    hop: -1,
    toast: null,

    select: (id) => {
      if (id === get().selectedId) return;
      set(id === null ? { selectedId: null } : { selectedId: id, trail: pushTrail(get().trail, id) });
    },
    hover: (id) => {
      if (id !== get().hoverId) set({ hoverId: id });
    },
    setVisible: (ids) => {
      set({ visible: new Set(ids) });
    },
    toggleDomain: (domain) => {
      const next = new Set(get().activeDomains);
      if (next.has(domain)) next.delete(domain);
      else next.add(domain);
      set({ activeDomains: next });
    },
    setDomains: (ds) => {
      set({ activeDomains: new Set(ds) });
    },
    setMode: (mode) => {
      if (mode === get().mode) return;
      set(mode === 'explore' ? { mode, route: emptyRoute, hop: -1 } : { mode });
    },
    setRoute: (route) => {
      set({ route: { ...get().route, ...route } });
    },
    clearRoute: () => {
      set({ route: emptyRoute, hop: -1 });
    },
    setHop: (hop) => {
      if (hop !== get().hop) set({ hop });
    },
    notify: (message) => {
      set({ toast: { id: ++toastId, message } });
    },
    dismissToast: () => {
      set({ toast: null });
    },
    clearTrail: () => {
      set({ trail: [] });
    },
  }));
}
