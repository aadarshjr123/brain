'use client';

import { useController, useExplore } from '../context';
import { domainStyle } from './domain-style';

/** Layers: what is on the map per domain, and a switch to dim each one. */
export function Legend() {
  const c = useController();
  const visible = useExplore((s) => s.visible);
  const active = useExplore((s) => s.activeDomains);
  const counts = new Map<string, number>();
  for (const id of visible) {
    const d = c.concept(id)?.domain;
    if (d) counts.set(d, (counts.get(d) ?? 0) + 1);
  }

  return (
    <section aria-labelledby="legend-title" className="flex min-w-[190px] flex-col gap-0.5 glass px-3 py-2.5">
      <h2
        id="legend-title"
        className="mb-1.5 flex justify-between font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase"
      >
        <span>Layers</span>
        <span>
          {visible.size} / {c.graph.nodes.size} shown
        </span>
      </h2>
      {c.domains.map((d) => {
        const on = active.has(d);
        return (
          <button
            key={d}
            type="button"
            aria-pressed={on}
            style={domainStyle(d)}
            onClick={() => {
              c.toggleDomain(d);
            }}
            className="flex items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-secondary aria-[pressed=false]:text-muted-foreground"
          >
            <span
              aria-hidden
              className={`size-[9px] flex-none rounded-full bg-(--c) ${on ? 'shadow-[0_0_8px_var(--c)]' : 'opacity-25'}`}
            />
            {c.domainName(d)}
            <span className="ml-auto font-mono text-[10.5px] text-muted-foreground">
              {counts.get(d) ?? 0}
            </span>
          </button>
        );
      })}
    </section>
  );
}
