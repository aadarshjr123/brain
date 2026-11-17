// @ts-check
import { base } from '@brain/config/eslint/base';

export default [
  ...base({ tsconfigRootDir: import.meta.dirname }),
  // Benchmarks report to the terminal on purpose.
  { files: ['bench/**'], rules: { 'no-console': 'off' } },
];
