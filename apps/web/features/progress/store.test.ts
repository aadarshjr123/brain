import 'fake-indexeddb/auto';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { parseBackup } from './backup';
import { BrainDb } from './db';
import { bookmarkToggled, conceptViewed, themeChanged } from './slices';
import {
  exportBackup,
  hydrate,
  importBackup,
  isUnavailable,
  makeProgressStore,
  selectExploredCount,
} from './store';

let n = 0;
const dbs: BrainDb[] = [];
const freshDb = () => {
  const db = new BrainDb(`test-${String(++n)}`);
  dbs.push(db);
  return db;
};
const source = (db: BrainDb | null) => () => Promise.resolve(db);
afterEach(async () => {
  for (const db of dbs.splice(0)) await db.delete();
});
/** Listener effects write asynchronously; wait until storage has what we expect rather than a fixed time. */
const persisted = async (db: BrainDb, events: number, bookmarks = 0) => {
  await vi.waitFor(async () => {
    expect(await db.events.count()).toBe(events);
    expect(await db.bookmarks.count()).toBe(bookmarks);
  });
};

describe('progress reducers', () => {
  it('folds views into a per-concept summary', () => {
    const store = makeProgressStore(source(null));
    store.dispatch(conceptViewed('dom', 100));
    store.dispatch(conceptViewed('dom', 300));
    store.dispatch(conceptViewed('v8', 200));
    expect(store.getState().progress.seen.dom).toEqual({ count: 2, firstSeen: 100, lastSeen: 300 });
    expect(selectExploredCount(store.getState())).toBe(2);
  });

  it('toggles bookmarks', () => {
    const store = makeProgressStore(source(null));
    store.dispatch(bookmarkToggled('dom'));
    store.dispatch(bookmarkToggled('v8'));
    store.dispatch(bookmarkToggled('dom'));
    expect(store.getState().bookmarks.ids).toEqual(['v8']);
  });
});

describe('persistence', () => {
  it('writes through to IndexedDB and a new session replays it', async () => {
    const db = freshDb();
    const first = makeProgressStore(source(db));
    await hydrate(first, source(db));
    first.dispatch(conceptViewed('dom', 1));
    first.dispatch(conceptViewed('dom', 2));
    first.dispatch(bookmarkToggled('event_loop'));
    first.dispatch(themeChanged('light'));
    await persisted(db, 2, 1);
    await vi.waitFor(async () => {
      expect((await db.settings.get('settings'))?.value.theme).toBe('light');
    });

    const second = makeProgressStore(source(db));
    await hydrate(second, source(db));
    const s = second.getState();
    expect(s.progress.seen.dom?.count).toBe(2);
    expect(s.bookmarks.ids).toEqual(['event_loop']);
    expect(s.settings.theme).toBe('light');
    expect(s.session).toEqual({ hydrated: true, storage: 'ok' });
  });

  it('keeps working in memory when storage is unavailable', async () => {
    const store = makeProgressStore(source(null));
    await hydrate(store, source(null));
    store.dispatch(conceptViewed('dom'));
    expect(store.getState().session.storage).toBe('unavailable');
    expect(selectExploredCount(store.getState())).toBe(1);
  });

  it('marks storage unavailable when IndexedDB throws', async () => {
    const db = freshDb();
    db.close();
    Object.defineProperty(db, 'events', {
      get: () => ({ orderBy: () => ({ toArray: () => Promise.reject(new Error('blocked')) }) }),
    });
    const store = makeProgressStore(source(db));
    await hydrate(store, source(db));
    expect(store.getState().session.storage).toBe('unavailable');
  });
});

describe('isUnavailable', () => {
  it('separates blocked storage from our own bugs', () => {
    const named = (name: string) => Object.assign(new Error(name), { name });
    expect(isUnavailable(named('MissingAPIError'))).toBe(true);
    expect(isUnavailable(named('OpenFailedError'))).toBe(true);
    // A bad query against our schema is a bug, not a private window (it hid a missing index once).
    expect(isUnavailable(named('SchemaError'))).toBe(false);
    expect(isUnavailable(new TypeError('x'))).toBe(false);
  });
});

describe('export and import', () => {
  it('round-trips through a JSON file into a different browser', async () => {
    const a = freshDb();
    const storeA = makeProgressStore(source(a));
    await hydrate(storeA, source(a));
    storeA.dispatch(conceptViewed('dom', 10));
    storeA.dispatch(conceptViewed('v8', 20));
    storeA.dispatch(bookmarkToggled('v8'));
    await persisted(a, 2, 1);
    const file = JSON.stringify(await exportBackup(storeA, source(a)));

    const b = freshDb();
    const storeB = makeProgressStore(source(b));
    await hydrate(storeB, source(b));
    const backup = parseBackup(file);
    if ('error' in backup) throw new Error(backup.error);
    await importBackup(storeB, source(b), backup);
    expect(selectExploredCount(storeB.getState())).toBe(2);
    expect(storeB.getState().bookmarks.ids).toEqual(['v8']);

    // and it persisted in B
    const storeB2 = makeProgressStore(source(b));
    await hydrate(storeB2, source(b));
    expect(selectExploredCount(storeB2.getState())).toBe(2);
  });

  it('rejects files that are not exports', () => {
    expect(parseBackup('not json')).toEqual({ error: 'That file is not JSON.' });
    expect(parseBackup('{"app":"other"}')).toEqual({ error: 'That file is not a Brain progress export.' });
    expect(
      parseBackup(
        JSON.stringify({
          app: 'brain',
          version: 1,
          exportedAt: 'x',
          events: [{ type: 'viewed', conceptId: '<script>', ts: 1 }],
          bookmarks: [],
          settings: { theme: 'dark' },
        }),
      ),
    ).toHaveProperty('error');
  });
});
