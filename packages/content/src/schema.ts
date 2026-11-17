import { z } from 'zod';

/**
 * Zod schemas for the YAML sources. Shape only: cross-file rules (unknown ids, duplicates,
 * connectivity) live in validate.ts, because they need the whole graph to judge.
 */

const id = z
  .string()
  .regex(
    /^[a-z][a-z0-9_]*$/,
    'ids are snake_case: lowercase letters, digits and underscores, starting with a letter',
  );

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'use YYYY-MM-DD')
  .refine((s) => !Number.isNaN(Date.parse(s)), 'not a real date');

export const DomainSchema = z.strictObject({
  id,
  name: z.string().min(1).max(40),
  description: z.string().min(1).max(200),
});

export const SourceSchema = z.strictObject({
  title: z.string().min(1).max(120),
  url: z.url({ protocol: /^https$/, error: 'sources must be https URLs' }),
});

export const NodeSchema = z.strictObject({
  id,
  label: z.string().min(1).max(48),
  summary: z
    .string()
    .trim()
    .min(20, 'write at least one full sentence')
    .max(400, 'keep summaries to one short paragraph (400 characters)'),
  aliases: z.array(z.string().min(1)).default([]),
  sources: z.array(SourceSchema).default([]),
  verified: isoDate,
});

/** Edges are written compactly in YAML as `[from, to, relation]` or `[from, to, relation, weight]`. */
export const EdgeSchema = z
  .union(
    [
      z.tuple([id, id, z.string()]),
      z.tuple([id, id, z.string(), z.union([z.literal(1), z.literal(2), z.literal(3)])]),
    ],
    { error: 'write an edge as [from, to, relation] or [from, to, relation, weight 1|2|3]' },
  )
  .transform(([from, to, relation, weight]) => ({ from, to, relation, weight: weight ?? 1 }));

export const DomainsFileSchema = z.array(DomainSchema);
export const NodesFileSchema = z.array(NodeSchema);
export const EdgesFileSchema = z.array(EdgeSchema);
