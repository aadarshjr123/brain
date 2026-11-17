'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { useEffect } from 'react';

import { useAppDispatch, useAppSelector } from '@/features/progress/provider';
import { themeChanged } from '@/features/progress/slices';
import type { ThemeSetting } from '@/features/progress/model';
import { cn } from '@/lib/utils';

import { applyTheme } from './theme';

const OPTIONS: { value: ThemeSetting; label: string; Icon: typeof Sun }[] = [
  { value: 'system', label: 'Match system theme', Icon: Monitor },
  { value: 'dark', label: 'Dark theme', Icon: Moon },
  { value: 'light', label: 'Light theme', Icon: Sun },
];

/** System, dark or light. A radio group, so arrow keys work and screen readers announce the choice. */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useAppSelector((s) => s.settings.theme);
  const hydrated = useAppSelector((s) => s.session.hydrated);
  const dispatch = useAppDispatch();

  // Settings load from IndexedDB after first paint; apply what was saved (the head script covered the paint).
  useEffect(() => {
    if (hydrated) applyTheme(theme);
  }, [hydrated, theme]);

  return (
    <div role="radiogroup" aria-label="Theme" className={cn('flex gap-0.5 glass p-[3px]', className)}>
      {OPTIONS.map(({ value, label, Icon }) => {
        const checked = theme === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={checked}
            aria-label={label}
            title={label}
            tabIndex={checked ? 0 : -1}
            onClick={() => {
              dispatch(themeChanged(value));
            }}
            onKeyDown={(e) => {
              const i = OPTIONS.findIndex((o) => o.value === value);
              const step =
                e.key === 'ArrowRight' || e.key === 'ArrowDown'
                  ? 1
                  : e.key === 'ArrowLeft' || e.key === 'ArrowUp'
                    ? -1
                    : 0;
              if (!step) return;
              e.preventDefault();
              const next = OPTIONS[(i + step + OPTIONS.length) % OPTIONS.length];
              if (next) dispatch(themeChanged(next.value));
              const group = e.currentTarget.parentElement;
              requestAnimationFrame(() => {
                group?.querySelector<HTMLButtonElement>('[aria-checked="true"]')?.focus();
              });
            }}
            className="grid h-[30px] w-8 place-items-center rounded-[9px] text-muted-foreground hover:text-foreground aria-checked:bg-primary aria-checked:text-primary-foreground [&_svg]:size-4"
          >
            <Icon aria-hidden />
          </button>
        );
      })}
    </div>
  );
}
