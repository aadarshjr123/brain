import type { Neighbour } from '@brain/graph-engine';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { CSSProperties } from 'react';

import { SiteHeader } from '@/components/site/site-header';
import { concept, conceptGraph, domainName, routesToHubs } from '@/lib/content';

interface Props {
  params: Promise<{ id: string }>;
}

/** Every concept is a static page: fast, crawlable, and the text twin of the map (works with JavaScript off). */
export function generateStaticParams() {
  return [...conceptGraph.nodes.keys()].map((id) => ({ id }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const node = concept((await params).id);
  if (!node) return {};
  return {
    title: node.label,
    description: node.summary,
    alternates: { canonical: `/concept/${node.id}` },
  };
}

export default async function ConceptPage({ params }: Props) {
  const node = concept((await params).id);
  if (!node) notFound();

  const neighbours = conceptGraph.neighbours(node.id);
  const drives = neighbours.filter((n) => n.direction === 'out');
  const drivenBy = neighbours.filter((n) => n.direction === 'in');
  const routes = routesToHubs(node.id);
  const style = { '--c': `var(--domain-${node.domain})` } as CSSProperties;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto max-w-3xl px-4 py-10 sm:px-6" style={style}>
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-muted-foreground">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/cheatsheet" className="hover:text-foreground">
                All concepts
              </Link>
            </li>
            <li aria-hidden>›</li>
            <li>{domainName(node.domain)}</li>
          </ol>
        </nav>

        <article>
          <header>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[color-mix(in_srgb,var(--c)_40%,transparent)] bg-[color-mix(in_srgb,var(--c)_10%,transparent)] px-2 py-0.5 font-mono text-[10px] tracking-[0.1em] text-(--c) uppercase">
              <span aria-hidden className="size-1.5 rounded-full bg-(--c)" />
              {domainName(node.domain)}
            </span>
            <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-balance">{node.label}</h1>
            <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{node.summary}</p>
            <p className="mt-6 flex flex-wrap gap-2">
              <Link
                href={`/explore?n=${node.id}`}
                className="inline-flex items-center rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
              >
                Open in the map
              </Link>
            </p>
          </header>

          <div className="mt-10 grid gap-8 sm:grid-cols-2">
            <Relations title={`${node.label} drives`} items={drives} />
            <Relations title="Driven by" items={drivenBy} />
          </div>

          {routes.length > 0 && (
            <section aria-labelledby="routes" className="mt-10">
              <h2 id="routes" className="font-display text-xl font-bold">
                How it reaches the big ideas
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                The shortest chains of cause and effect to the map&apos;s hub concepts.
              </p>
              <ol className="mt-4 flex flex-col gap-4">
                {routes.map((route) => {
                  const end = route.at(-1);
                  if (!end) return null;
                  return (
                    <li key={end.id} className="rounded-xl border border-border p-4">
                      <p className="text-sm leading-7">
                        {route.map((hop, i) => (
                          <span key={hop.id}>
                            {i > 0 && (
                              <span className="mx-1.5 font-mono text-xs text-primary">{hop.via} →</span>
                            )}
                            <Link
                              href={`/concept/${hop.id}`}
                              className="font-medium underline-offset-4 hover:underline"
                            >
                              {hop.label}
                            </Link>
                          </span>
                        ))}
                      </p>
                      <Link
                        href={`/explore?from=${node.id}&to=${end.id}`}
                        className="mt-2 inline-block text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                      >
                        Watch this route on the map
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </section>
          )}

          <footer className="mt-10 border-t border-border pt-6 text-sm text-muted-foreground">
            <h2 className="font-display text-base font-bold text-foreground">Sources</h2>
            {node.sources.length > 0 ? (
              <ul className="mt-2 list-disc pl-5">
                {node.sources.map((s) => (
                  <li key={s.url}>
                    <a
                      href={s.url}
                      rel="noopener"
                      className="underline underline-offset-4 hover:text-foreground"
                    >
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2">Sources for this concept are being added.</p>
            )}
            <p className="mt-4">
              Last checked against sources: <time dateTime={node.verified}>{node.verified}</time>. Spotted a
              mistake?{' '}
              <a
                href={`https://github.com/aadarshjr123/brain/issues/new?template=content.md&title=${encodeURIComponent(`content: ${node.id}`)}`}
                className="underline underline-offset-4 hover:text-foreground"
              >
                Report it
              </a>
              .
            </p>
          </footer>
        </article>
      </main>
    </>
  );
}

function Relations({ title, items }: { title: string; items: readonly Neighbour[] }) {
  if (items.length === 0) return null;
  return (
    <section>
      <h2 className="font-mono text-xs tracking-[0.1em] text-muted-foreground uppercase">
        {title} ({items.length})
      </h2>
      <ul className="mt-3 flex flex-col gap-1">
        {items.map((n) => {
          const to = concept(n.id);
          if (!to) return null;
          return (
            <li key={n.id} style={{ '--c': `var(--domain-${to.domain})` } as CSSProperties}>
              <Link
                href={`/concept/${to.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-lg px-2 py-1.5 hover:bg-secondary"
              >
                <span className="flex items-center gap-2 font-medium">
                  <span aria-hidden className="size-2 flex-none rounded-full bg-(--c)" />
                  {to.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{n.relation}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
