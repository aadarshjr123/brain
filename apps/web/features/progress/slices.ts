import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

import { type ProgressEvent, type Seen, type Settings, type ThemeSetting, defaultSettings } from './model';

/**
 * Progress is derived by replaying events (ADR-0006: replayable domain state). The reducer folds one event
 * at a time, so hydrating from storage and recording live views go through the same code.
 */
export interface ProgressState {
  seen: Record<string, Seen>;
  /** Total events folded in; the export writes them back out from storage. */
  events: number;
}

const initialProgress: ProgressState = { seen: {}, events: 0 };

function fold(state: ProgressState, e: ProgressEvent): void {
  const prev = state.seen[e.conceptId];
  state.seen[e.conceptId] = prev
    ? {
        count: prev.count + 1,
        firstSeen: Math.min(prev.firstSeen, e.ts),
        lastSeen: Math.max(prev.lastSeen, e.ts),
      }
    : { count: 1, firstSeen: e.ts, lastSeen: e.ts };
  state.events++;
}

export const progress = createSlice({
  name: 'progress',
  initialState: initialProgress,
  reducers: {
    conceptViewed: {
      reducer(state, action: PayloadAction<ProgressEvent>) {
        fold(state, action.payload);
      },
      prepare(conceptId: string, ts: number = Date.now()) {
        return { payload: { type: 'viewed' as const, conceptId, ts } };
      },
    },
    replaced(_state, action: PayloadAction<readonly ProgressEvent[]>) {
      const next: ProgressState = { seen: {}, events: 0 };
      for (const e of action.payload) fold(next, e);
      return next;
    },
  },
});

export const bookmarks = createSlice({
  name: 'bookmarks',
  initialState: { ids: [] as string[] },
  reducers: {
    bookmarkToggled(state, action: PayloadAction<string>) {
      const i = state.ids.indexOf(action.payload);
      if (i === -1) state.ids.push(action.payload);
      else state.ids.splice(i, 1);
    },
    bookmarksReplaced(state, action: PayloadAction<readonly string[]>) {
      state.ids = [...new Set(action.payload)];
    },
  },
});

export const settings = createSlice({
  name: 'settings',
  initialState: defaultSettings,
  reducers: {
    themeChanged(state, action: PayloadAction<ThemeSetting>) {
      state.theme = action.payload;
    },
    settingsReplaced(_state, action: PayloadAction<Settings>) {
      return action.payload;
    },
  },
});

/** Session: whether storage works, so the UI can say so once instead of failing silently. */
export const session = createSlice({
  name: 'session',
  initialState: { hydrated: false, storage: 'unknown' as 'unknown' | 'ok' | 'unavailable' },
  reducers: {
    hydrated(state, action: PayloadAction<'ok' | 'unavailable'>) {
      state.hydrated = true;
      state.storage = action.payload;
    },
  },
});

export const { conceptViewed, replaced: progressReplaced } = progress.actions;
export const { bookmarkToggled, bookmarksReplaced } = bookmarks.actions;
export const { themeChanged, settingsReplaced } = settings.actions;
export const { hydrated } = session.actions;
