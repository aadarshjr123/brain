import type { Metadata } from 'next';

import { SiteHeader } from '@/components/site/site-header';
import { conceptGraph, conceptsByDomain } from '@/lib/content';

import { CheatsheetList, type Group } from './cheatsheet-list';

export const metadata: Metadata = {
  title: 'Cheatsheet',
  description:
    'Every concept on the map in one list: what it is and what it touches, grouped by layer. Printable.',
  alternates: { canonical: '/cheatsheet' },
};

export default function CheatsheetPage() {
  const groups: Group[] = conceptsByDomain().map(({ domain, nodes }) => ({
    id: domain.id,
    name: domain.name,
    description: domain.description,
    concepts: nodes.map((n) => ({
      id: n.id,
      label: n.label,
      summary: n.summary,
      aliases: n.aliases,
      touches: conceptGraph.degree(n.id),
    })),
  }));

  return (
    <>
      <div className="print:hidden">
        <SiteHeader />
      </div>
      <main id="main" className="mx-auto max-w-5xl px-4 py-10 sm:px-6 print:max-w-none print:p-0">
        <h1 className="font-display text-4xl font-bold tracking-tight">Cheatsheet</h1>
        <p className="mt-3 max-w-prose text-muted-foreground print:hidden">
          Every concept on the map, grouped by layer. Filter by name, or print it: the print version is one
          clean column.
        </p>
        <CheatsheetList groups={groups} />
      </main>
    </>
  );
}
