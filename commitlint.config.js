// @ts-check
/**
 * Conventional Commits (docs/05-process.md). Scope is the area touched.
 * Example: feat(engine): ring placement on unfold
 */

/** @type {import('@commitlint/types').UserConfig} */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['repo', 'web', 'content', 'engine', 'config', 'ci', 'docs', 'deps', 'infra'],
    ],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [0],
  },
};
