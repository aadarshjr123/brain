import { describe, expect, it } from 'vitest';

import { EdgeSchema, NodeSchema } from './schema.ts';

const node = {
  id: 'event_loop',
  label: 'Event loop',
  summary: 'Picks one task, runs it to completion, drains microtasks, then maybe renders.',
  verified: '2026-11-16',
};

describe('NodeSchema', () => {
  it('accepts a minimal node and fills defaults', () => {
    expect(NodeSchema.parse(node)).toEqual({ ...node, aliases: [], sources: [] });
  });

  it.each([
    ['id is not snake_case', { id: 'EventLoop' }],
    ['summary is too short', { summary: 'Loop.' }],
    ['summary is too long', { summary: 'x'.repeat(401) }],
    ['date is not real', { verified: '2026-02-31x' }],
    ['source is not https', { sources: [{ title: 'Spec', url: 'http://example.com' }] }],
    ['an unknown key is present', { extra: true }],
  ])('rejects a node when %s', (_, patch) => {
    expect(NodeSchema.safeParse({ ...node, ...patch }).success).toBe(false);
  });
});

describe('EdgeSchema', () => {
  it('reads the compact tuple and defaults the weight to 1', () => {
    expect(EdgeSchema.parse(['a', 'b', 'drives'])).toEqual({
      from: 'a',
      to: 'b',
      relation: 'drives',
      weight: 1,
    });
  });

  it('keeps an explicit weight', () => {
    expect(EdgeSchema.parse(['a', 'b', 'drives', 3])).toMatchObject({ weight: 3 });
  });

  it('explains the expected shape when an edge is malformed', () => {
    const result = EdgeSchema.safeParse(['a', 'b']);
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toMatch(/\[from, to, relation\]/);
  });
});
