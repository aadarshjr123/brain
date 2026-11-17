'use client';

import { useController, useExplore } from '../context';

/** What Route mode is waiting for, at a glance. */
export function RoutePill() {
  const c = useController();
  const mode = useExplore((s) => s.mode);
  const route = useExplore((s) => s.route);
  if (mode !== 'route') return null;
  const label = (id: string | null) => (id ? (c.concept(id)?.label ?? id) : '');
  const text =
    route.from === null
      ? 'Pick a start concept'
      : route.to === null
        ? `From ${label(route.from)}, now pick a destination`
        : `${label(route.from)} → ${label(route.to)} · ${route.path ? `${String(route.path.length - 1)} hops` : 'no path'}`;
  return (
    <p className="flex items-center gap-2.5 glass px-3.5 py-[7px] text-[13px]">
      <span
        aria-hidden
        className="size-2 rounded-full bg-primary shadow-[0_0_10px_var(--brand-accent)] motion-safe:animate-pulse"
      />
      {text}
    </p>
  );
}
