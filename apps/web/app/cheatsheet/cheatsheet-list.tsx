'use client';

import Link from 'next/link';
import { type CSSProperties, useState } from 'react';

export interface Group {
  id: string;
  name: string;
  description: string;
  concepts: { id: string; label: string; summary: string; aliases: string[]; touches: number }[];
}

/**
 * Server-rendered in full (works with JavaScript off and for search engines); with JavaScript the filter narrows it.
 */
export function CheatsheetList({ groups }: { groups: Group[] }) {
  const [text, setText] = useState('');
  const [off, setOff] = useState<ReadonlySet<string>>(new Set());
  const q = text.trim().toLowerCase();
  const matches = (c: Group['concepts'][number]) =>
    !q ||
    c.label.toLowerCase().includes(q) ||
    c.summary.toLowerCase().includes(q) ||
    c.aliases.some((a) => a.toLowerCase().includes(q));
  const visible = groups
    .filter((g) => !off.has(g.id))
    .map((g) => ({ ...g, concepts: g.concepts.filter(matches) }))
    .filter((g) => g.concepts.length > 0);
  const count = visible.reduce((n, g) => n + g.concepts.length, 0);

  return (
    <>
      <div className="sticky top-0 z-10 -mx-4 mt-6 border-b border-border bg-background/90 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 print:hidden">
        <label className="flex items-center gap-3">
          <span className="sr-only">Filter concepts</span>
          <input
            type="search"
            value={text}
            onChange={(e) => {
              setText(e.target.value);
            }}
            placeholder="Filter: hydration, CORS, paint…"
            className="w-full max-w-md rounded-lg border border-input bg-transparent px-3 py-2 text-sm placeholder:text-muted-foreground"
          />
          <span role="status" className="flex-none font-mono text-xs text-muted-foreground">
            {count} shown
          </span>
        </label>
        <div role="group" aria-label="Layers" className="mt-3 flex flex-wrap gap-1.5">
          {groups.map((g) => {
            const on = !off.has(g.id);
            return (
              <button
                key={g.id}
                type="button"
                aria-pressed={on}
                style={{ '--c': `var(--domain-${g.id})` } as CSSProperties}
                onClick={() => {
                  const next = new Set(off);
                  if (on) next.add(g.id);
                  else next.delete(g.id);
                  setOff(next);
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs aria-pressed:border-(--c) aria-[pressed=false]:text-muted-foreground"
              >
                <span aria-hidden className={`size-2 rounded-full bg-(--c) ${on ? '' : 'opacity-30'}`} />
                {g.name}
              </button>
            );
          })}
        </div>
      </div>

      {visible.length === 0 && <p className="mt-10 text-muted-foreground">Nothing matches “{text}”.</p>}

      {visible.map((g) => (
        <section
          key={g.id}
          aria-labelledby={`layer-${g.id}`}
          style={{ '--c': `var(--domain-${g.id})` } as CSSProperties}
          className="mt-10 print:mt-6"
        >
          <h2 id={`layer-${g.id}`} className="flex items-center gap-2 font-display text-2xl font-bold">
            <span aria-hidden className="size-3 rounded-full bg-(--c) print:border print:border-black" />
            {g.name}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{g.description}</p>
          <dl className="mt-4 grid gap-x-8 gap-y-4 sm:grid-cols-2 print:block">
            {g.concepts.map((c) => (
              <div key={c.id} className="break-inside-avoid print:mb-3">
                <dt>
                  <Link
                    href={`/concept/${c.id}`}
                    className="font-semibold underline-offset-4 hover:underline"
                  >
                    {c.label}
                  </Link>
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    touches {c.touches}
                  </span>
                </dt>
                <dd className="mt-0.5 text-sm text-muted-foreground print:text-black">{c.summary}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </>
  );
}
