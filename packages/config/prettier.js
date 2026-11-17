// @ts-check
/** Shared Prettier preset. The web app extends it with the Tailwind class-sorting plugin. */

/** @type {import('prettier').Config} */
export default {
  printWidth: 110,
  singleQuote: true,
  trailingComma: 'all',
  semi: true,
  arrowParens: 'always',
  endOfLine: 'lf',
  overrides: [{ files: '*.md', options: { printWidth: 120, proseWrap: 'preserve' } }],
};
