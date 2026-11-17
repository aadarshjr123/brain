'use client';

import { Search } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import { useController } from '../context';
import { domainStyle } from './domain-style';

/** Combobox: "/" focuses, arrows move, Enter jumps, Escape closes (WAI-ARIA combobox pattern). */
export function SearchBox({ onPick }: { onPick?: (id: string) => void }) {
  const controller = useController();
  const [text, setText] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const listId = useId();
  const hits = controller.search.query(text);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)
        return;
      e.preventDefault();
      input.current?.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  const pick = (id: string) => {
    setText('');
    setOpen(false);
    input.current?.blur();
    if (onPick) onPick(id);
    else controller.jump(id);
  };

  const showList = open && hits.length > 0;
  return (
    <div className="relative flex w-full items-center gap-2 glass px-3 py-1.5 sm:w-[min(480px,100%)] sm:justify-self-center">
      <Search aria-hidden className="size-4 flex-none text-muted-foreground" />
      <input
        ref={input}
        type="search"
        role="combobox"
        aria-label="Jump to a concept"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList ? `${listId}-${String(active)}` : undefined}
        placeholder="Jump to a concept: event loop, fiber, CORS…"
        autoComplete="off"
        spellCheck={false}
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          setActive(0);
          setOpen(true);
        }}
        onFocus={() => {
          setOpen(true);
        }}
        onBlur={() => {
          setOpen(false);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            input.current?.blur();
          } else if (!hits.length) {
            return;
          } else if (e.key === 'ArrowDown') {
            setActive((i) => (i + 1) % hits.length);
          } else if (e.key === 'ArrowUp') {
            setActive((i) => (i - 1 + hits.length) % hits.length);
          } else if (e.key === 'Enter') {
            const hit = hits[active];
            if (hit) pick(hit.id);
          } else {
            return;
          }
          e.preventDefault();
        }}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      <kbd className="hidden flex-none rounded border border-input px-1.5 font-mono text-[10px] text-muted-foreground sm:inline">
        /
      </kbd>
      <div
        id={listId}
        role="listbox"
        aria-label="Matching concepts"
        hidden={!showList}
        className="absolute inset-x-0 top-full mt-1.5 max-h-80 overflow-y-auto glass p-1"
      >
        {hits.map((n, i) => (
          <div
            key={n.id}
            id={`${listId}-${String(i)}`}
            role="option"
            aria-selected={i === active}
            // Focus stays in the input (aria-activedescendant); -1 keeps options out of the tab order.
            tabIndex={-1}
            style={domainStyle(n.domain)}
            // mousedown, not click: the input's blur would close the list first
            onMouseDown={(e) => {
              e.preventDefault();
              pick(n.id);
            }}
            onMouseEnter={() => {
              setActive(i);
            }}
            className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm aria-selected:bg-secondary"
          >
            <span aria-hidden className="size-2 flex-none rounded-full bg-(--c)" />
            <span className="truncate">{n.label}</span>
            <span className="ml-auto flex-none font-mono text-[10px] tracking-wide text-muted-foreground">
              {controller.domainName(n.domain)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
