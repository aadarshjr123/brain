'use client';

import { BookMarked, Download, Upload } from 'lucide-react';
import { useId, useRef, useState } from 'react';

import { domainStyle } from '@/features/explore/components/domain-style';
import { useController } from '@/features/explore/context';

import { ThemeToggle } from '@/features/theme/theme-toggle';

import { useAppSelector, useProgressContext } from './provider';
import { exportBackup, importBackup, selectExploredCount } from './store';

/** Your progress: counts, bookmarks, and a backup you can carry to another browser. */
export function ProgressPanel() {
  const c = useController();
  const { store, getDb } = useProgressContext();
  const explored = useAppSelector(selectExploredCount);
  const marks = useAppSelector((s) => s.bookmarks.ids);
  const storage = useAppSelector((s) => s.session.storage);
  const [message, setMessage] = useState<string | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const panelId = useId();
  const total = c.graph.nodes.size;

  const download = async () => {
    const backup = await exportBackup(store, getDb);
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }),
    );
    const a = document.createElement('a');
    a.href = url;
    a.download = `brain-progress-${backup.exportedAt.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage('Exported.');
  };

  const upload = async (f: File) => {
    // The validator (Zod) loads only when someone imports a file.
    const { parseBackup } = await import('./backup');
    const parsed = parseBackup(await f.text());
    if ('error' in parsed) {
      setMessage(parsed.error);
      return;
    }
    await importBackup(store, getDb, parsed);
    setMessage(
      `Imported ${String(parsed.events.length)} views and ${String(parsed.bookmarks.length)} bookmarks.`,
    );
  };

  return (
    <>
      <button
        type="button"
        popoverTarget={panelId}
        // The accessible name contains the visible text ("2/144"), so voice control users can say what they see.
        aria-label={`Your progress: ${String(explored)}/${String(total)} explored`}
        title="Your progress"
        className="flex h-[38px] items-center gap-1.5 glass px-3 text-xs text-muted-foreground hover:text-foreground"
      >
        <BookMarked aria-hidden className="size-4" />
        <span className="font-mono">
          {explored}/{total}
        </span>
      </button>
      <div
        id={panelId}
        popover="auto"
        className="inset-auto top-16 right-4 m-0 w-[300px] rounded-(--radius) border border-border bg-popover p-4 text-sm text-popover-foreground shadow-2xl"
      >
        <h2 className="font-display text-lg font-bold">Your progress</h2>
        <p className="mt-1 text-muted-foreground">
          {explored} of {total} concepts explored. Saved in this browser only
          {storage === 'unavailable'
            ? ', and right now storage is blocked, so it lasts until you close the tab.'
            : '.'}
        </p>

        <h3 className="mt-4 mb-1.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          Bookmarks ({marks.length})
        </h3>
        {marks.length === 0 ? (
          <p className="text-muted-foreground">Star a concept on its card to keep it here.</p>
        ) : (
          <ul className="flex max-h-48 flex-col gap-px overflow-auto">
            {marks.map((id) => {
              const n = c.concept(id);
              if (!n) return null;
              return (
                <li key={id}>
                  <button
                    type="button"
                    style={domainStyle(n.domain)}
                    onClick={() => {
                      c.jump(id);
                    }}
                    className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left hover:bg-secondary"
                  >
                    <span aria-hidden className="size-[7px] flex-none rounded-full bg-(--c)" />
                    {n.label}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={() => void download()}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <Download aria-hidden className="size-3.5" /> Export
          </button>
          <button
            type="button"
            onClick={() => file.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-[9px] border border-border bg-secondary px-3 py-[7px] text-[12.5px] hover:border-input"
          >
            <Upload aria-hidden className="size-3.5" /> Import
          </button>
          <input
            ref={file}
            type="file"
            accept="application/json,.json"
            aria-label="Import a progress file"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
        </div>
        <h3 className="mt-4 mb-1.5 font-mono text-[10px] tracking-[0.1em] text-muted-foreground uppercase">
          Theme
        </h3>
        <ThemeToggle className="w-fit" />
        <p role="status" className="mt-2 min-h-5 text-xs text-muted-foreground">
          {message}
        </p>
      </div>
    </>
  );
}
