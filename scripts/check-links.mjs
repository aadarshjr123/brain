// Checks that every source URL in the content resolves (BRAIN-32). Network-dependent, so it runs on a schedule
// and on demand, not on every PR: a flaky third-party site must not block unrelated work.
// Usage: node scripts/check-links.mjs [file-with-urls]   (defaults to the compiled content)
import { readFileSync } from 'node:fs';

const urls = process.argv[2]
  ? readFileSync(process.argv[2], 'utf8')
      .split('\n')
      .map((l) => l.split('\t').at(-1)?.trim())
      .filter(Boolean)
  : JSON.parse(readFileSync('packages/content/generated/graph.json', 'utf8')).nodes.flatMap((n) =>
      n.sources.map((s) => s.url),
    );

const unique = [...new Set(urls)];
const UA = 'Mozilla/5.0 (compatible; brain-link-check/1.0; +https://github.com/aadarshjr123/brain)';

async function check(url) {
  for (const method of ['HEAD', 'GET']) {
    try {
      const res = await fetch(url, {
        method,
        redirect: 'follow',
        headers: { 'user-agent': UA },
        signal: AbortSignal.timeout(15_000),
      });
      if (res.ok) return { url, ok: true, status: res.status, final: res.url };
      if (method === 'GET') return { url, ok: false, status: res.status };
    } catch (error) {
      if (method === 'GET') return { url, ok: false, status: String(error.cause?.code ?? error.name) };
    }
  }
  return { url, ok: false, status: 'unknown' };
}

const results = [];
for (let i = 0; i < unique.length; i += 8)
  results.push(...(await Promise.all(unique.slice(i, i + 8).map(check))));
const broken = results.filter((r) => !r.ok);
// A move is a different page: ignore fragments (fetch drops them), trailing slashes and locale negotiation (?hl=).
const canonical = (u) => {
  const x = new URL(u);
  x.hash = '';
  x.searchParams.delete('hl');
  return x.toString().replace(/\/$/, '');
};
const moved = results.filter((r) => r.ok && r.final && canonical(r.final) !== canonical(r.url));
for (const r of moved) console.log(`↪ ${r.url}\n    → ${r.final}`);
for (const r of broken) console.error(`✗ ${String(r.status)} ${r.url}`);
console.log(
  `${String(unique.length - broken.length)}/${String(unique.length)} source URLs resolve${moved.length ? `, ${String(moved.length)} redirect` : ''}`,
);
process.exit(broken.length ? 1 : 0);
