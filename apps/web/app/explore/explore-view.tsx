'use client';

import { Stage } from '@/features/explore/components/stage';
import { ExploreProvider } from '@/features/explore/context';

export function ExploreView() {
  return (
    <ExploreProvider>
      <main className="fixed inset-0 overflow-hidden bg-background">
        <h1 className="sr-only">Brain concept map</h1>
        <Stage />
      </main>
    </ExploreProvider>
  );
}
