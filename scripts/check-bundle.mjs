// Bundle budget (system design §1, BRAIN-30): first-load JS per page, gzipped, read from the built HTML.
// Run after `next build`. Fails CI when a page is over budget, and prints the numbers for the PR.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';

const NEXT = 'apps/web/.next';
const BUDGETS = { '/explore': 250, '/': 200, '/cheatsheet': 200, '/concept/event_loop': 200 }; // KB, gzipped

const htmlFor = (route) => join(NEXT, 'server/app', route === '/' ? 'index.html' : `${route.slice(1)}.html`);

let failed = false;
for (const [route, budget] of Object.entries(BUDGETS)) {
  const html = readFileSync(htmlFor(route), 'utf8');
  // Script tags a modern browser downloads: `noModule` ones (legacy polyfills) are skipped by every current browser.
  const tags = html.match(/<script[^>]*src="\/_next\/static\/chunks\/[^"]+\.js"[^>]*>/g) ?? [];
  const chunks = [
    ...new Set(
      tags
        .filter((t) => !/nomodule/i.test(t))
        .map((t) => /src="(\/_next\/static\/chunks\/[^"]+\.js)"/.exec(t)?.[1] ?? ''),
    ),
  ].filter(Boolean);
  const bytes = chunks.reduce(
    (sum, c) => sum + gzipSync(readFileSync(join(NEXT, c.replace('/_next/', '')))).length,
    0,
  );
  const kb = bytes / 1024;
  const ok = kb <= budget;
  failed ||= !ok;
  console.log(
    `${ok ? '✓' : '✗'} ${route.padEnd(22)} ${kb.toFixed(1).padStart(6)} KB gz  (budget ${String(budget)} KB, ${String(chunks.length)} chunks)`,
  );
}
if (failed) {
  console.error(
    'A page is over its JavaScript budget. Find the new weight with `ANALYZE=1 pnpm build` or split it out.',
  );
  process.exit(1);
}
