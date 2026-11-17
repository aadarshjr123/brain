import Dexie, { type EntityTable } from 'dexie';

import type { ProgressEvent, Settings } from './model';

interface StoredEvent extends ProgressEvent {
  id?: number;
}

/** IndexedDB through Dexie (ADR-0005). Append-only events; bookmarks and settings as small rows. */
export class BrainDb extends Dexie {
  events!: EntityTable<StoredEvent, 'id'>;
  bookmarks!: EntityTable<{ id: string; ts: number }, 'id'>;
  settings!: EntityTable<{ key: 'settings'; value: Settings }, 'key'>;

  constructor(name = 'brain') {
    super(name);
    this.version(1).stores({
      events: '++id, conceptId, ts',
      bookmarks: 'id, ts',
      settings: 'key',
    });
  }
}
