import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

import { parse } from 'yaml';
import type { z } from 'zod';

import { DomainsFileSchema, EdgesFileSchema, NodesFileSchema } from './schema.ts';
import type { ConceptNode, ContentGraph } from './types.ts';

/** One readable line per problem: `file › path: message`. */
export class ContentError extends Error {
  readonly problems: string[];
  constructor(problems: string[]) {
    super(`Content is invalid:\n${problems.map((p) => `  ✗ ${p}`).join('\n')}`);
    this.name = 'ContentError';
    this.problems = problems;
  }
}

function formatIssues(file: string, error: z.ZodError, data: unknown): string[] {
  return error.issues.map((issue) => {
    // Name the entry by its id when we can, so "nodes/js.yaml › [12].summary" becomes "› closures.summary".
    const [index, ...rest] = issue.path;
    const entry = Array.isArray(data) && typeof index === 'number' ? (data[index] as unknown) : undefined;
    const entryId =
      entry && typeof entry === 'object' && 'id' in entry && typeof entry.id === 'string'
        ? entry.id
        : undefined;
    const where = [entryId ?? (index === undefined ? '' : `[${String(index)}]`), ...rest.map(String)]
      .filter(Boolean)
      .join('.');
    return `${file}${where ? ` › ${where}` : ''}: ${issue.message}`;
  });
}

function readYaml(dir: string, file: string): unknown {
  const text = readFileSync(join(dir, file), 'utf8');
  return parse(text) ?? [];
}

/**
 * Reads every YAML source under `dir`, checks its shape, and returns the raw graph.
 * Node files are named after their domain (`nodes/js.yaml`), which sets each node's domain.
 * Throws a ContentError listing every shape problem at once, not just the first.
 */
export function loadContent(dir: string): ContentGraph {
  const problems: string[] = [];

  const parseFile = <S extends z.ZodType>(file: string, schema: S): z.output<S> | undefined => {
    let data: unknown;
    try {
      data = readYaml(dir, file);
    } catch (error) {
      problems.push(`${file}: YAML syntax error: ${(error as Error).message.split('\n')[0] ?? ''}`);
      return undefined;
    }
    const result = schema.safeParse(data);
    if (!result.success) {
      problems.push(...formatIssues(file, result.error, data));
      return undefined;
    }
    return result.data;
  };

  const domains = parseFile('domains.yaml', DomainsFileSchema) ?? [];
  const edges = parseFile('edges.yaml', EdgesFileSchema) ?? [];

  const nodes: ConceptNode[] = [];
  // Git does not track empty folders, so a fresh checkout with no concepts yet has no nodes/ at all.
  const nodesDir = join(dir, 'nodes');
  const nodeFiles = (existsSync(nodesDir) ? readdirSync(nodesDir) : [])
    .filter((f) => f.endsWith('.yaml'))
    .sort();
  for (const file of nodeFiles) {
    const domain = basename(file, '.yaml');
    const parsed = parseFile(relative(dir, join(dir, 'nodes', file)), NodesFileSchema);
    if (parsed) nodes.push(...parsed.map((n) => ({ ...n, domain })));
  }

  if (problems.length) throw new ContentError(problems);
  return { domains, nodes, edges };
}
