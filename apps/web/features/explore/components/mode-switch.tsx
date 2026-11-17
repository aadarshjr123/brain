'use client';

import { useController, useExplore } from '../context';

/** Explore or Route. A two-button toggle with aria-pressed, as in mockup v3. */
export function ModeSwitch() {
  const c = useController();
  const mode = useExplore((s) => s.mode);
  return (
    <div role="group" aria-label="Mode" className="flex gap-0.5 glass p-[3px]">
      {(['explore', 'route'] as const).map((m) => (
        <button
          key={m}
          type="button"
          aria-pressed={mode === m}
          onClick={() => {
            c.setMode(m);
          }}
          className="rounded-[9px] px-2.5 py-[5px] text-[13px] font-medium text-muted-foreground capitalize aria-pressed:bg-primary aria-pressed:text-primary-foreground sm:px-3"
        >
          {m}
        </button>
      ))}
    </div>
  );
}
