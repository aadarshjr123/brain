import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createContext, runInContext } from 'node:vm';

import { describe, expect, it } from 'vitest';

// Load the real worker file in a sandbox and test its routing rules (ADR-0010).
const source = readFileSync(fileURLToPath(new URL('../../public/sw.js', import.meta.url)), 'utf8');
const sandbox = createContext({
  self: { addEventListener: () => undefined, location: { origin: 'https://brain.dev' } },
  URL,
});
runInContext(source, sandbox);
const routeFor = sandbox.routeFor as (url: string, mode: string, method: string, origin: string) => string;
const route = (path: string, mode = 'cors', method = 'GET') =>
  routeFor(`https://brain.dev${path}`, mode, method, 'https://brain.dev');

describe('service worker routing', () => {
  it('serves pages network-first with an offline copy', () => {
    expect(route('/explore?n=dom', 'navigate')).toBe('page');
    expect(route('/concept/cors', 'navigate')).toBe('page');
  });

  it('caches hashed build assets forever', () => {
    expect(route('/_next/static/chunks/abc123.js')).toBe('immutable');
  });

  it('never caches React Server Component payloads or other /_next data', () => {
    expect(route('/_next/data/build/x.json')).toBe('network');
    expect(route('/_next/image?url=x')).toBe('network');
  });

  it('revalidates other same-origin files', () => {
    expect(route('/icon.svg')).toBe('revalidate');
    expect(route('/opengraph-image')).toBe('revalidate');
  });

  it('leaves analytics, debug, other origins and non-GET alone', () => {
    expect(route('/_vercel/insights/script.js')).toBe('network');
    expect(route('/debug/sentry', 'navigate')).toBe('network');
    expect(routeFor('https://sentry.io/api', 'cors', 'GET', 'https://brain.dev')).toBe('network');
    expect(route('/explore', 'navigate', 'POST')).toBe('network');
  });

  it('names caches by version, so a new version clears old ones', () => {
    expect(source).toMatch(/const VERSION = 'v\d+';/);
  });
});
