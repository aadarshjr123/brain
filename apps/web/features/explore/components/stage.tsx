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
      className="block size-full cursor-grab touch-none data-dragging:cursor-grabbing"
      aria-label="Concept map. Use the search box or the cheatsheet for a text version."
    />
  );
}
