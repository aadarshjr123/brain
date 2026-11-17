'use client';

import { useEffect, useRef } from 'react';

import { useController } from '../context';

/** The canvas. Mounted once; the controller owns everything that happens on it. */
export function Stage() {
  const controller = useController();
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return controller.attach(canvas);
  }, [controller]);

  return (
    <canvas
      ref={ref}
      // Focusable so the map works from the keyboard; the live region announces what is selected.
      tabIndex={0}
      aria-label="Concept map"
      aria-describedby="map-help"
      onKeyDown={(e) => {
        if (controller.handleKey(e.key)) e.preventDefault();
      }}
      className="block size-full cursor-grab touch-none outline-none focus-visible:outline-2 focus-visible:-outline-offset-4 focus-visible:outline-ring data-dragging:cursor-grabbing"
    />
  );
}
