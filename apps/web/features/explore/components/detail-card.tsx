'use client';

import type { Neighbour } from '@brain/graph-engine';
import { Route, Shrink, Sparkles, X } from 'lucide-react';

import { BookmarkButton } from '@/features/progress/bookmark-button';

import { useController, useExplore } from '../context';
import { domainStyle } from './domain-style';

/** The selected concept: what it is, what it drives, what drives it. */
export function DetailCard() {
  const c = useController();
  const selectedId = useExplore((s) => s.selectedId);
  // Re-render when the map changes, so the unfold count stays right.
  useExplore((s) => s.visible);
  const node = selectedId ? c.concept(selectedId) : undefined;
  if (!node) return null;

  const neighbours = c.graph.neighbours(node.id);
  const drives = neighbours.filter((n) => n.direction === 'out');
  const drivenBy = neighbours.filter((n) => n.direction === 'in');
  const hidden = c.hiddenCount(node.id);

  return (
    <aside
      aria-labelledby="card-title"
      style={domainStyle(node.domain)}
      className="flex max-h-full flex-col overflow-auto glass"
    >
      <header className="sticky top-0 z-[1] border-b border-border bg-surface px-4 pt-4 pb-3 backdrop-blur-[14px]">
        <button
          type="button"
          aria-label="Close"
          onClick={() => {
            c.select(null);
          }}
          className="absolute top-2.5 right-2.5 grid size-7 place-items-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"
        >
          <X aria-hidden className="size-4" />
        </button>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--c)_40%,transparent)] bg-[color-mix(in_srgb,var(--c)_10%,transparent)] px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-(--c) uppercase">
          <span aria-hidden className="size-1.5 rounded-full bg-(--c)" />
          {c.domainName(node.domain)}
        </span>
        <h2
          id="card-title"
          className="mt-2 mb-1.5 font-display text-[22px] leading-tight font-bold text-balance"
        >
          {node.label}
        </h2>
        <p className="text-[13.5px] text-muted-foreground">{node.summary}</p>
      </header>

      <div className="px-4 pt-3 pb-4">
        <div className="mb-1.5 flex flex-wrap gap-1.5">
          {hidden > 0 ? (
            <button
              type="button"
              onClick={() => {
                c.unfold(node.id);
              }}
              className="inline-flex items-center gap-1.5 rounded-[9px] bg-primary px-3 py-[7px] text-[12.5px] font-semibold text-primary-foreground"
            >
              <Sparkles aria-hidden className="size-3.5" />
              Unfold {hidden} more
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                const n = c.fold(node.id);
                if (n === 0)
                  c.store.getState().notify('Nothing to fold: every neighbour is still linked elsewhere');
              }}
              className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
            >
              <Shrink aria-hidden className="size-3.5" />
              Fold
            </button>
          )}
          <BookmarkButton id={node.id} label={node.label} />
          <button
            type="button"
            onClick={() => {
              c.routeFrom(node.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <Route aria-hidden className="size-3.5" /> From here
          </button>
          <button
            type="button"
            onClick={() => {
              c.routeTo(node.id);
            }}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <Route aria-hidden className="size-3.5" /> To here
          </button>
        </div>
        <Relations title={`${node.label} drives`} items={drives} fromId={node.id} />
        <Relations title={`Driven by`} items={drivenBy} fromId={node.id} />
      </div>
    </aside>
  );
}

function Relations({ title, items, fromId }: { title: string; items: readonly Neighbour[]; fromId: string }) {
  const c = useController();
  if (items.length === 0) return null;
  return (
    <section>
      <h3 className="mt-3.5 mb-1.5 flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase after:h-px after:flex-1 after:bg-border">
        {title} ({items.length})
      </h3>
      <ul className="flex flex-col gap-px">
        {items.map((n) => {
          const to = c.concept(n.id);
          if (!to) return null;
          return (
            <li key={n.id}>
              <button
                type="button"
                style={domainStyle(to.domain)}
                onClick={() => {
                  c.reveal(n.id, fromId);
                  c.select(n.id);
                  c.center(n.id);
                }}
                className="grid w-full grid-cols-[1fr_auto] items-center gap-2.5 rounded-lg px-2 py-[7px] text-left hover:bg-secondary"
              >
                <span className="flex min-w-0 items-center gap-2 font-medium">
                  <span aria-hidden className="size-[7px] flex-none rounded-full bg-(--c)" />
                  <span className="truncate">{to.label}</span>
                </span>
                <span className="text-right font-mono text-[10.5px] whitespace-nowrap text-muted-foreground">
                  {n.relation}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
