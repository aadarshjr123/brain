import { z } from 'zod';

/** What the map can restore from a link. Route params (from, to) join in BRAIN-24. */
export interface UrlState {
  /** Selected concept. */
  n?: string;
  /** Active layers; absent means all. */
  layers?: string[];
  from?: string;
  to?: string;
}

const id = z.string().regex(/^[a-z][a-z0-9_]*$/);
const list = z
  .string()
  .transform((s) => s.split(',').filter(Boolean))
  .pipe(z.array(id));

const Schema = z.object({
  n: id.optional().catch(undefined),
  layers: list.optional().catch(undefined),
  from: id.optional().catch(undefined),
  to: id.optional().catch(undefined),
});

/**
 * Lenient by design: a link from an older version, a typo or a removed concept must still open the map.
 * Anything malformed or unknown is dropped, never thrown.
 */
export function parseUrlState(
  search: string,
  known: { concept: (id: string) => boolean; domain: (id: string) => boolean },
): UrlState {
  const params = new URLSearchParams(search);
  const raw = Object.fromEntries(
    ['n', 'layers', 'from', 'to'].flatMap((k) => {
      const v = params.get(k);
      return v === null ? [] : [[k, v]];
    }),
  );
  const parsed = Schema.parse(raw);
  const out: UrlState = {};
  if (parsed.n && known.concept(parsed.n)) out.n = parsed.n;
  if (parsed.from && known.concept(parsed.from)) out.from = parsed.from;
  if (parsed.to && known.concept(parsed.to)) out.to = parsed.to;
  if (parsed.layers) {
    const layers = parsed.layers.filter(known.domain);
    if (layers.length) out.layers = layers;
  }
  return out;
}

/** Builds the query string. Omits defaults so a plain map stays a plain /explore. */
export function serialiseUrlState(state: UrlState, allDomains: readonly string[]): string {
  const params = new URLSearchParams();
  if (state.n) params.set('n', state.n);
  if (state.from) params.set('from', state.from);
  if (state.to) params.set('to', state.to);
  if (state.layers && state.layers.length < allDomains.length) {
    // Keep the canonical domain order so the same state gives the same URL.
    params.set('layers', allDomains.filter((d) => state.layers?.includes(d)).join(','));
  }
  const s = params.toString().replaceAll('%2C', ',');
  return s ? `?${s}` : '';
}
