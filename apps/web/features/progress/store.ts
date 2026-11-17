import { configureStore, createListenerMiddleware } from '@reduxjs/toolkit';

import { captureException } from '@/lib/observability/sentry';

import type { Backup } from './backup';
import type { BrainDb } from './db';

/** IndexedDB opens lazily: Dexie loads in its own chunk after first paint, never on a page's critical path. */
export type DbSource = () => Promise<BrainDb | null>;
import {
  bookmarkToggled,
  bookmarks,
  bookmarksReplaced,
  conceptViewed,
  hydrated,
  progress,
  progressReplaced,
  session,
  settings,
  settingsReplaced,
  themeChanged,
} from './slices';

/**
 * Domain state (ADR-0006): progress, bookmarks, settings and session in Redux Toolkit.
 * Listener middleware writes each change to IndexedDB. If storage fails, the app keeps working in memory.
 */
export function makeProgressStore(getDb: DbSource) {
  const listener = createListenerMiddleware();
  const store = configureStore({
    reducer: {
      progress: progress.reducer,
      bookmarks: bookmarks.reducer,
      settings: settings.reducer,
      session: session.reducer,
    },
    middleware: (getDefault) => getDefault().prepend(listener.middleware),
  });

  {
    const safely = async (write: (db: BrainDb) => Promise<unknown>) => {
      const db = await getDb().catch(() => null);
      if (db) await write(db).catch(() => undefined);
    };
    listener.startListening({
      actionCreator: conceptViewed,
      effect: async (action) => {
        // A copy: Dexie writes the generated id back onto the object, and Redux actions are frozen.
        await safely((db) => db.events.add({ ...action.payload }));
      },
    });
    listener.startListening({
      actionCreator: bookmarkToggled,
      effect: async (action, api) => {
        const id = action.payload;
        const on = (api.getState() as RootState).bookmarks.ids.includes(id);
        await safely((db) => (on ? db.bookmarks.put({ id, ts: Date.now() }) : db.bookmarks.delete(id)));
      },
    });
    listener.startListening({
      actionCreator: themeChanged,
      effect: async (_action, api) => {
        await safely((db) =>
          db.settings.put({ key: 'settings', value: (api.getState() as RootState).settings }),
        );
      },
    });
  }
  return store;
}

export type ProgressStore = ReturnType<typeof makeProgressStore>;
export type RootState = ReturnType<ProgressStore['getState']>;
export type AppDispatch = ProgressStore['dispatch'];

/** Load everything from IndexedDB into Redux by replaying events. Marks storage unavailable instead of throwing. */
export async function hydrate(store: ProgressStore, getDb: DbSource): Promise<void> {
  const db = await getDb().catch(() => null);
  if (!db) {
    store.dispatch(hydrated('unavailable'));
    return;
  }
  try {
    const [events, marks, saved] = await Promise.all([
      db.events.orderBy('ts').toArray(),
      db.bookmarks.orderBy('ts').toArray(),
      db.settings.get('settings'),
    ]);
    store.dispatch(progressReplaced(events.map(({ type, conceptId, ts }) => ({ type, conceptId, ts }))));
    store.dispatch(bookmarksReplaced(marks.map((b) => b.id)));
    if (saved) store.dispatch(settingsReplaced(saved.value));
    store.dispatch(hydrated('ok'));
  } catch (error) {
    // Private windows and blocked storage are expected: degrade quietly. Anything else is our bug: report it.
    if (!isUnavailable(error)) void captureException(error);
    store.dispatch(hydrated('unavailable'));
  }
}

const UNAVAILABLE = new Set([
  'MissingAPIError',
  'OpenFailedError',
  'DatabaseClosedError',
  'InvalidStateError',
  'QuotaExceededError',
  'SecurityError',
]);

/** Errors that mean "this browser will not give us IndexedDB", as opposed to a bug in our schema or queries. */
export function isUnavailable(error: unknown): boolean {
  return error instanceof Error && UNAVAILABLE.has(error.name);
}

export async function exportBackup(store: ProgressStore, getDb: DbSource): Promise<Backup> {
  const state = store.getState();
  const db = await getDb().catch(() => null);
  const events = db
    ? await db.events
        .orderBy('ts')
        .toArray()
        .catch(() => [])
    : [];
  return {
    app: 'brain',
    version: 1,
    exportedAt: new Date().toISOString(),
    events: events.map(({ type, conceptId, ts }) => ({ type, conceptId, ts })),
    bookmarks: [...state.bookmarks.ids],
    settings: { ...state.settings },
  };
}

/** Replace everything with a backup, in storage first and then in memory. */
export async function importBackup(store: ProgressStore, getDb: DbSource, backup: Backup): Promise<void> {
  const db = await getDb().catch(() => null);
  if (db) {
    await db
      .transaction('rw', [db.events, db.bookmarks, db.settings], async () => {
        await Promise.all([db.events.clear(), db.bookmarks.clear()]);
        await db.events.bulkAdd(backup.events.map((e) => ({ ...e })));
        await db.bookmarks.bulkPut(backup.bookmarks.map((id, i) => ({ id, ts: i })));
        await db.settings.put({ key: 'settings', value: backup.settings });
      })
      .catch(() => undefined);
  }
  store.dispatch(progressReplaced(backup.events));
  store.dispatch(bookmarksReplaced(backup.bookmarks));
  store.dispatch(settingsReplaced(backup.settings));
}

export const selectExploredCount = (s: RootState) => Object.keys(s.progress.seen).length;
export const selectIsBookmarked = (id: string) => (s: RootState) => s.bookmarks.ids.includes(id);
