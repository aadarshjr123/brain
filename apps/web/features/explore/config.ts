/** Product decisions for the map, in one place. */
export const EXPLORE = {
  /** Start view: one hub per layer of the story (mockup v3). */
  seeds: ['event_loop', 'main_thread', 'v8', 'dom', 'fetch', 'fiber', 'sop', 'core_web_vitals'],
  /** Unfold reveals at most this many at once; hubs get "Unfold N more" (system design §6). */
  unfoldPage: 12,
  trailLength: 6,
  toastMs: 2200,
  /** The seeds repel each other on load; fit the view once they have spread. */
  initialFitMs: 900,
} as const;
