'use client';

import { graph } from '@brain/content';
import { createContext, use, useEffect, useState } from 'react';
import { useStore } from 'zustand';

import { ExploreController } from './controller';
import type { ExploreActions, ExploreState } from './store';

const ControllerContext = createContext<ExploreController | null>(null);

function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Creates one controller per mount of the map. Children read it with useController / useExplore. */
export function ExploreProvider({ children }: { children: React.ReactNode }) {
  const [controller] = useState(
    () => new ExploreController({ content: graph, reducedMotion: prefersReducedMotion() }),
  );
  useEffect(() => {
    // End-to-end tests drive the canvas through the controller. Compiled out unless NEXT_PUBLIC_E2E=1.
    if (process.env.NEXT_PUBLIC_E2E === '1') Object.assign(window, { __brain: controller });
    return () => {
      controller.destroy();
    };
  }, [controller]);
  return <ControllerContext value={controller}>{children}</ControllerContext>;
}

export function useController(): ExploreController {
  const controller = use(ControllerContext);
  if (!controller) throw new Error('useController must be used inside <ExploreProvider>');
  return controller;
}

/** Subscribe to one slice of the map state. Keep selectors narrow: a panel re-renders when its slice changes. */
export function useExplore<T>(selector: (state: ExploreState & ExploreActions) => T): T {
  return useStore(useController().store, selector);
}
