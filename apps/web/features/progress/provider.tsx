'use client';

import { createContext, use, useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

import { BrainDb } from './db';
import { type AppDispatch, type ProgressStore, type RootState, hydrate, makeProgressStore } from './store';

interface ProgressContext {
  store: ProgressStore;
  db: BrainDb | null;
}

const Context = createContext<ProgressContext | null>(null);

function openDb(): BrainDb | null {
  // No IndexedDB at all (very old browsers, some embedded webviews): run in memory.
  return typeof indexedDB === 'undefined' ? null : new BrainDb();
}

/** Redux for domain state, loaded from IndexedDB once per visit. Wraps every page. */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [value] = useState<ProgressContext>(() => {
    const db = typeof window === 'undefined' ? null : openDb();
    return { db, store: makeProgressStore(db) };
  });
  useEffect(() => {
    void hydrate(value.store, value.db);
  }, [value]);
  return (
    <Context value={value}>
      <Provider store={value.store}>{children}</Provider>
    </Context>
  );
}

export function useProgressContext(): ProgressContext {
  const ctx = use(Context);
  if (!ctx) throw new Error('useProgressContext must be used inside <ProgressProvider>');
  return ctx;
}

export const useAppSelector = useSelector.withTypes<RootState>();
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
