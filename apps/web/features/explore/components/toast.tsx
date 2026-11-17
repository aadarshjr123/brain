'use client';

import { useEffect } from 'react';

import { EXPLORE } from '../config';
import { useExplore } from '../context';

/** Short notices. A polite live region, so screen readers hear them without losing focus. */
export function Toast() {
  const toast = useExplore((s) => s.toast);
  const dismiss = useExplore((s) => s.dismissToast);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, EXPLORE.toastMs);
    return () => {
      clearTimeout(t);
    };
  }, [toast, dismiss]);

  return (
    <div role="status" aria-live="polite" className="pointer-events-none">
      {toast && (
        <p
          key={toast.id}
          className="animate-in glass px-3.5 py-2 text-[12.5px] text-muted-foreground fade-in"
        >
          {toast.message}
        </p>
      )}
    </div>
  );
}
