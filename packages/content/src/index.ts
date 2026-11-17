/**
 * Client-safe entry: the compiled graph and its types. No Zod, no YAML, no Node APIs.
 * `generated/graph.json` is produced by `pnpm --filter @brain/content build` (Turborepo runs it first).
 */
import data from '../generated/graph.json' with { type: 'json' };

export type * from './types.ts';

/** Typed by `generated/graph.d.json.ts`, which the compiler writes next to the JSON. */
export const graph = data;
