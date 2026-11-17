import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { ContentError, loadContent } from './load.ts';

function fixture(files: Record<string, string>): string {
  const dir = mkdtempSync(join(tmpdir(), 'brain-content-'));
  mkdirSync(join(dir, 'nodes'));
  for (const [name, text] of Object.entries(files)) writeFileSync(join(dir, name), text);
  return dir;
}

const domains = '- { id: js, name: JavaScript, description: The language. }\n';

describe('loadContent', () => {
  it('sets each node domain from its file name', () => {
    const dir = fixture({
      'domains.yaml': domains,
      'edges.yaml': '[]',
      'nodes/js.yaml':
        '- { id: closures, label: Closures, summary: Functions keep their scope alive., verified: 2026-11-16 }',
    });
    expect(loadContent(dir).nodes[0]).toMatchObject({ id: 'closures', domain: 'js' });
  });

  it('reports every problem at once, naming the file and the entry id', () => {
    const dir = fixture({
      'domains.yaml': domains,
      'edges.yaml': '- [a]\n',
      'nodes/js.yaml': '- { id: closures, label: Closures, summary: short, verified: 2026-11-16 }',
    });
    try {
      loadContent(dir);
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ContentError);
      const { problems } = error as ContentError;
      expect(problems).toHaveLength(2);
      expect(problems).toContainEqual(expect.stringMatching(/^nodes\/js\.yaml › closures\.summary:/));
      expect(problems).toContainEqual(expect.stringMatching(/^edges\.yaml › \[0\]:/));
    }
  });

  it('treats a missing nodes/ folder as no concepts', () => {
    const dir = mkdtempSync(join(tmpdir(), 'brain-content-'));
    writeFileSync(join(dir, 'domains.yaml'), domains);
    writeFileSync(join(dir, 'edges.yaml'), '[]');
    expect(loadContent(dir).nodes).toEqual([]);
  });

  it('reports YAML syntax errors with the file name', () => {
    const dir = fixture({ 'domains.yaml': 'a: [unclosed', 'edges.yaml': '[]' });
    expect(() => loadContent(dir)).toThrow(/domains\.yaml: YAML syntax error/);
  });
});
