import { z } from 'zod';

import type { ProgressEvent, Settings } from './model';

/** The export file. Versioned so a future format can still read today's backups. */
export interface Backup {
  app: 'brain';
  version: 1;
  exportedAt: string;
  events: ProgressEvent[];
  bookmarks: string[];
  settings: Settings;
}

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);

export const BackupSchema = z.object({
  app: z.literal('brain'),
  version: z.literal(1),
  exportedAt: z.string(),
  events: z
    .array(z.object({ type: z.literal('viewed'), conceptId: id, ts: z.number().int().nonnegative() }))
    .max(1_000_000),
  bookmarks: z.array(id).max(10_000),
  settings: z.object({ theme: z.enum(['system', 'dark', 'light']) }),
});

export function parseBackup(text: string): Backup | { error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch {
    return { error: 'That file is not JSON.' };
  }
  const result = BackupSchema.safeParse(json);
  return result.success ? result.data : { error: 'That file is not a Brain progress export.' };
}
