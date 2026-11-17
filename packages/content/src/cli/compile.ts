/**
 * Content build: YAML in `data/`, validated JSON out in `generated/graph.json`.
 * Run with `node src/cli/compile.ts` (Node strips the types; no build tool).
 * Exits 1 with every problem listed when the content is invalid, which fails `pnpm build` and CI.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { ContentError, loadContent } from '../load.ts';
import { type Severity, validateGraph } from '../validate.ts';

/** Every concept must cite a source (M4 content drive, BRAIN-32). */
const MISSING_SOURCES: Severity = 'error';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const out = join(root, 'generated', 'graph.json');

try {
  const graph = loadContent(join(root, 'data'));

  const findings = validateGraph(graph, { missingSources: MISSING_SOURCES });
  for (const f of findings.filter((x) => x.severity === 'warning'))
    console.warn(`  ⚠ ${f.rule}: ${f.message}`);
  const errors = findings.filter((x) => x.severity === 'error');
  if (errors.length) throw new ContentError(errors.map((f) => `${f.rule}: ${f.message}`));

  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, `${JSON.stringify(graph)}\n`);
  // A declaration beside the JSON: consumers get the real types without inferring a 150 KB literal.
  writeFileSync(
    join(dirname(out), 'graph.d.json.ts'),
    "import type { ContentGraph } from '../src/types.ts';\n\ndeclare const graph: ContentGraph;\nexport default graph;\n",
  );
  console.log(
    `✓ content: ${String(graph.domains.length)} domains, ${String(graph.nodes.length)} nodes, ${String(graph.edges.length)} edges`,
  );
} catch (error) {
  if (error instanceof ContentError) {
    console.error(error.message);
    process.exit(1);
  }
  throw error;
}
