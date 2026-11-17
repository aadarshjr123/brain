import Link from 'next/link';
import type { CSSProperties } from 'react';

import { SiteHeader } from '@/components/site/site-header';
import { concept, conceptGraph, domains, routeAsText } from '@/lib/content';

/** Example routes: each answers a question people actually ask. */
const EXAMPLES = [
  { from: 'set_state', to: 'gpu_process', question: 'What happens between setState and pixels on screen?' },
  { from: 'cors', to: 'fiber', question: 'How does a CORS check end up delaying a React render?' },
  { from: 'localstorage', to: 'inp', question: 'How can reading localStorage make a click feel slow?' },
] as const;

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-5xl px-4 sm:px-6">
        <section className="py-16 sm:py-24">
          <p className="font-mono text-xs tracking-widest text-muted-foreground uppercase">
            Frontend ↔ Browser
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-5xl font-bold tracking-tight text-balance sm:text-6xl">
            See what your code touches inside the browser.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            A free map of {conceptGraph.nodes.size} concepts and how they connect. Click a concept to unfold
            what it drives and what drives it, or pick two and follow the shortest chain of cause and effect
            between them, explained hop by hop. No account, nothing to install.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center rounded-lg bg-primary px-5 py-2.5 font-medium text-primary-foreground"
            >
              Open the map
            </Link>
            <Link
              href="/cheatsheet"
              className="inline-flex items-center rounded-lg border border-border px-5 py-2.5 font-medium hover:bg-secondary"
            >
              Browse the cheatsheet
            </Link>
          </div>
          <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 text-sm" aria-label="Layers on the map">
            {domains.map((d) => (
              <li
                key={d.id}
                className="flex items-center gap-2"
                style={{ '--c': `var(--domain-${d.id})` } as CSSProperties}
              >
                <span aria-hidden className="size-2 rounded-full bg-(--c)" />
                {d.name}
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="examples" className="border-t border-border py-14">
          <h2 id="examples" className="font-display text-2xl font-bold">
            Try a route
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {EXAMPLES.map((ex) => {
              const route = routeAsText(ex.from, ex.to);
              const from = concept(ex.from);
              const to = concept(ex.to);
              if (!route || !from || !to) return null;
              return (
                <li key={ex.from} className="flex flex-col rounded-xl border border-border p-5">
                  <p className="font-medium">{ex.question}</p>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {route.map((h, i) => (
                      <span key={h.id}>
                        {i > 0 && ' › '}
                        {h.label}
                      </span>
                    ))}
                  </p>
                  <Link
                    href={`/explore?from=${ex.from}&to=${ex.to}`}
                    className="mt-auto pt-4 text-sm font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Watch {route.length - 1 === 1 ? '1 hop' : `${String(route.length - 1)} hops`} on the map →
                  </Link>
                </li>
              );
            })}
          </ol>
        </section>

        <section aria-labelledby="how" className="border-t border-border py-14">
          <h2 id="how" className="font-display text-2xl font-bold">
            How to use it
          </h2>
          <dl className="mt-6 grid gap-6 md:grid-cols-3">
            <div>
              <dt className="font-semibold">Explore</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Click a concept to unfold its neighbours. The card says what it drives and what drives it.
                Press / to search.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Route</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Pick a start and a destination. The map draws the shortest chain and narrates each hop.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Look it up</dt>
              <dd className="mt-1 text-sm text-muted-foreground">
                Every concept has its own page with relations, routes to the big ideas and sources. Your
                progress stays in your browser.
              </dd>
            </div>
          </dl>
        </section>
      </main>
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-wrap gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted-foreground sm:px-6">
          <span>Brain is open source.</span>
          <a
            href="https://github.com/aadarshjr123/brain"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Code and docs on GitHub
          </a>
          <a
            href="https://github.com/aadarshjr123/brain/blob/main/CONTRIBUTING.md"
            className="underline-offset-4 hover:text-foreground hover:underline"
          >
            Fix or add a concept
          </a>
        </div>
      </footer>
    </>
  );
}
