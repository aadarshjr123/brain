'use client';

import { useEffect } from 'react';

import { Brand } from '@/features/explore/components/brand';
import { DetailCard } from '@/features/explore/components/detail-card';
import { Legend } from '@/features/explore/components/legend';
import { SearchBox } from '@/features/explore/components/search-box';
import { Stage } from '@/features/explore/components/stage';
import { Toast } from '@/features/explore/components/toast';
import { Tools } from '@/features/explore/components/tools';
import { Trail } from '@/features/explore/components/trail';
import { ExploreProvider, useController, useExplore } from '@/features/explore/context';
import { ProgressBridge } from '@/features/progress/progress-bridge';
import { ProgressPanel } from '@/features/progress/progress-panel';
import { ThemeToggle } from '@/features/theme/theme-toggle';

export function ExploreView() {
  return (
    <ExploreProvider>
      <main id="main" className="fixed inset-0 overflow-hidden bg-background px-4">
        <h1 className="sr-only">Brain concept map</h1>
        <p id="map-help" className="sr-only">
          Arrow keys move between connected concepts, Enter unfolds the selected one, Escape clears, plus and
          minus zoom. The cheatsheet lists every concept as text.
        </p>
        <Stage />
        <Announcer />
        <Overlay />
        <ProgressBridge />
      </main>
    </ExploreProvider>
  );
}

/** Screen readers hear what the map is showing, since the canvas itself is silent. */
function Announcer() {
  const c = useController();
  const selectedId = useExplore((s) => s.selectedId);
  const node = selectedId ? c.concept(selectedId) : undefined;
  const text = node
    ? `${node.label}, ${c.domainName(node.domain)}. ${String(c.graph.degree(node.id))} connections, ${String(c.hiddenCount(node.id))} not yet on the map.`
    : '';
  return (
    <p aria-live="polite" className="sr-only">
      {text}
    </p>
  );
}

/** Panels float over the canvas; the wrapper lets clicks through except on the panels themselves. */
function Overlay() {
  const c = useController();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement)) c.select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, [c]);

  return (
    <>
      <div className="pointer-events-none absolute inset-x-4 top-2.5 z-[4] grid grid-cols-[1fr_auto] items-center gap-2.5 sm:top-3.5 sm:grid-cols-[auto_minmax(0,1fr)_auto] [&>*]:pointer-events-auto">
        <div className="col-start-1 row-start-1 justify-self-start">
          <Brand />
        </div>
        <div className="col-span-2 col-start-1 row-start-2 sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:flex sm:justify-center">
          <SearchBox />
        </div>
        <div className="col-start-2 row-start-1 flex items-center gap-2 justify-self-end sm:col-start-3">
          <ProgressPanel />
          <ThemeToggle className="hidden lg:flex" />
          <Tools />
        </div>
      </div>

      <div className="absolute bottom-3.5 left-4 z-[3] hidden md:block">
        <Legend />
      </div>
      <div className="absolute bottom-3.5 left-1/2 z-[3] hidden -translate-x-1/2 md:block">
        <Trail />
      </div>
      <div className="absolute bottom-16 left-1/2 z-[3] -translate-x-1/2">
        <Toast />
      </div>

      <div className="absolute inset-x-0 bottom-0 z-[4] max-h-[50%] md:inset-x-auto md:top-[66px] md:right-4 md:bottom-auto md:max-h-[calc(100%-92px)] md:w-[340px] [&>aside]:rounded-b-none md:[&>aside]:rounded-b-[var(--radius)]">
        <DetailCard />
      </div>
    </>
  );
}
