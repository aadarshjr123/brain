/** Domain types for what a visitor has done. Shared by Redux, IndexedDB and the export file. */

export interface ProgressEvent {
  type: 'viewed';
  conceptId: string;
  /** Epoch ms. */
  ts: number;
}

export type ThemeSetting = 'system' | 'dark' | 'light';

export interface Settings {
  theme: ThemeSetting;
}

export const defaultSettings: Settings = { theme: 'system' };

export interface Seen {
  count: number;
  firstSeen: number;
  lastSeen: number;
}
