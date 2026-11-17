// @ts-check
import { next } from '@brain/config/eslint/next';

const config = [
  ...next({ tsconfigRootDir: import.meta.dirname }),
  // End-to-end specs report measurements to the terminal on purpose.
  { files: ['e2e/**'], rules: { 'no-console': 'off' } },
];

export default config;
