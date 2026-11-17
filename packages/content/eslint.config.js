// @ts-check
import { base } from '@brain/config/eslint/base';

export default [
  ...base({ tsconfigRootDir: import.meta.dirname }),
  { ignores: ['generated/**'] },
  // Command-line entry points report to the terminal on purpose.
  { files: ['src/cli/**'], rules: { 'no-console': 'off' } },
];
