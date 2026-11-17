'use client';

import { ArrowLeftRight, RotateCcw, X } from 'lucide-react';
import type { CSSProperties } from 'react';

import { cn } from '@/lib/utils';

import { useController, useExplore } from '../context';

/** The route as a numbered story. Each hop lights up as the pulse on the map reaches it. */
export function RouteCard() {
  const c = useController();
  const route = useExplore((s) => s.route);
  const hop = useExplore((s) => s.hop);
  if (route.from === null || route.to === null) return null;
  const from = c.concept(route.from);
  const to = c.concept(route.to);
  if (!from || !to) return null;

  const close = (
    <button
      type="button"
      aria-label="Clear route"
      onClick={() => {
        c.clearRoute();
      }}
      className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
    >
      <X aria-hidden className="size-4" />
    </button>
  );
  const chip = (text: string) => (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--brand-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--brand-accent)_10%,transparent)] px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-primary uppercase">
      <span aria-hidden className="size-1.5 rounded-full bg-primary" />
      {text}
    </span>
  );

  if (!route.path) {
    return (
      <aside aria-labelledby="route-title" className="relative flex flex-col glass px-4 pt-4 pb-4">
        {close}
        {chip('Route')}
        <h2 id="route-title" className="mt-2 mb-1.5 font-display text-[22px] font-bold">
          No path
        </h2>
        <p className="text-[13.5px] text-muted-foreground">These two are not connected in the map yet.</p>
      </aside>
    );
  }

  const path = route.path;
  return (
    <aside aria-labelledby="route-title" className="flex max-h-full flex-col overflow-auto glass">
      <header className="sticky top-0 z-[1] border-b border-border bg-surface px-4 pt-4 pb-3 backdrop-blur-[14px]">
        {close}
        {chip(`Route · ${String(path.length - 1)} hops`)}
        <h2
          id="route-title"
          className="mt-2 mb-1.5 font-display text-[22px] leading-tight font-bold text-balance"
        >
          {from.label} → {to.label}
        </h2>
        <p className="text-[13.5px] text-muted-foreground">
          The shortest chain of “touches”. Follow the pulse on the map; each step lights up as it arrives.
        </p>
      </header>
      <div className="px-4 pt-3 pb-4">
        <ol className="relative before:absolute before:top-3 before:bottom-3 before:left-[9px] before:w-0.5 before:bg-border">
          {path.map((id, i) => {
            const n = c.concept(id);
            if (!n) return null;
            const reached = i <= hop;
            const now = i === hop;
            const prev = i > 0 ? path[i - 1] : undefined;
            return (
              <li key={id} style={{ '--c': `var(--domain-${n.domain})` } as CSSProperties}>
                {prev !== undefined && (
                  <p className="py-0.5 pl-[30px] font-mono text-[11px] text-primary">
                    {c.hopRelation(prev, id)}
                  </p>
                )}
                <div
                  aria-current={now ? 'step' : undefined}
                  className={cn(
                    'grid grid-cols-[20px_1fr] gap-2.5 py-1.5 transition-opacity',
                    reached ? 'opacity-100' : 'opacity-45',
                  )}
                >
                  <span
                    className={cn(
                      'relative z-[1] grid size-5 place-items-center rounded-full border-2 border-(--c) font-mono text-[9px]',
                      // Foreground on a tint, not white on the raw domain colour: several domain colours are under 4.5:1 with white.
                      reached
                        ? 'bg-[color-mix(in_srgb,var(--c)_35%,var(--brand-surface-solid))] text-foreground'
                        : 'bg-surface-solid',
                      now && 'shadow-[0_0_0_4px_color-mix(in_srgb,var(--c)_30%,transparent)]',
                    )}
                  >
                    {i + 1}
                  </span>
                  <div>
                    <b className="block font-semibold">{n.label}</b>
                    <p className="text-[12.5px] text-muted-foreground">{n.summary}</p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
        <div className="mt-3.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => {
              c.replayRoute();
            }}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <RotateCcw aria-hidden className="size-3.5" /> Replay
          </button>
          <button
            type="button"
            onClick={() => {
              c.reverseRoute();
            }}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <ArrowLeftRight aria-hidden className="size-3.5" /> Reverse
          </button>
          <button
            type="button"
            onClick={() => {
              c.clearRoute();
            }}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <X aria-hidden className="size-3.5" /> Clear route
          </button>
        </div>
      </div>
    </aside>
  );
}
