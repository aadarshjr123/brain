'use client';

import { useState } from 'react';

export function ThrowButton() {
  const [boom, setBoom] = useState(false);
  if (boom) throw new Error('BRAIN-6 intentional error: Sentry wiring check');
  return (
    <button
      type="button"
      onClick={() => {
        setBoom(true);
      }}
      className="mt-6 rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground"
    >
      Throw a test error
    </button>
  );
}
