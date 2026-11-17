'use client';

import { Fragment } from 'react';

import { useController, useExplore } from '../context';
import { domainStyle } from './domain-style';

/** Breadcrumb of the last concepts you looked at; click to go back. */
export function Trail() {
  const c = useController();
  const trail = useExplore((s) => s.trail);
  if (trail.length === 0) return null;
  return (
    <nav
      aria-label="Recently viewed"
      className="flex max-w-[60vw] items-center gap-1.5 overflow-hidden glass px-2 py-1.5"
    >
      <span className="px-1 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
        Trail
      </span>
      {trail.map((id, i) => (
        <Fragment key={id}>
          {i > 0 && (
            <span aria-hidden className="text-[11px] text-muted-foreground">
              ›
            </span>
          )}
          <button
            type="button"
            style={domainStyle(c.concept(id)?.domain ?? '')}
            onClick={() => {
              c.reveal(id);
              c.select(id);
              c.center(id);
            }}
            className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs whitespace-nowrap"
          >
            <span aria-hidden className="size-1.5 rounded-full bg-(--c)" />
            {c.concept(id)?.label ?? id}
          </button>
        </Fragment>
      ))}
    </nav>
  );
}
