'use client';

import { Expand, Maximize, Minus, Plus, RotateCcw } from 'lucide-react';

import { useController } from '../context';
import { IconButton } from './icon-button';

export function Tools() {
  const c = useController();
  return (
    <div className="flex gap-0.5 glass p-[3px]" role="toolbar" aria-label="Map controls">
      <IconButton
        label="Zoom in"
        onClick={() => {
          c.zoomIn();
        }}
      >
        <Plus aria-hidden />
      </IconButton>
      <IconButton
        label="Zoom out"
        onClick={() => {
          c.zoomOut();
        }}
      >
        <Minus aria-hidden />
      </IconButton>
      <IconButton
        label="Fit to view"
        onClick={() => {
          c.fit();
        }}
      >
        <Maximize aria-hidden />
      </IconButton>
      <IconButton
        label="Unfold everything"
        onClick={() => {
          c.unfoldAll();
        }}
      >
        <Expand aria-hidden />
      </IconButton>
      <IconButton
        label="Reset the map"
        onClick={() => {
          c.reset();
        }}
      >
        <RotateCcw aria-hidden />
      </IconButton>
    </div>
  );
}
