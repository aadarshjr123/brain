'use client';

import { createContext, use, useEffect, useState } from 'react';
import { Provider, useDispatch, useSelector } from 'react-redux';

import type { BrainDb } from './db';
import {
  type AppDispatch,
  type DbSource,
  type ProgressStore,
  type RootState,
  hydrate,
  makeProgressStore,
} from './store';

interface ProgressContext {
  store: ProgressStore;
  getDb: DbSource;
}

const Context = createContext<ProgressContext | null>(null);

/** Opens the database once, on first use, from a separate chunk. */
function lazyDb(): DbSource {
  let opening: Promise<BrainDb | null> | undefined;
  return () =>
    (opening ??=
      // No IndexedDB at all (server render, very old browsers, some webviews): run in memory.
      typeof indexedDB === 'undefined'
        ? Promise.resolve(null)
        : import('./db').then(({ BrainDb }) => new BrainDb()));
}

/** Redux for domain state, loaded from IndexedDB once per visit. Wraps every page. */
export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [value] = useState<ProgressContext>(() => {
    const getDb = lazyDb();
    return { getDb, store: makeProgressStore(getDb) };
  });
  useEffect(() => {
    void hydrate(value.store, value.getDb);
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
