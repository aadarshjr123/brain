// @ts-check
/**
 * ESLint preset for the Next.js app: base preset + Next.js core web vitals + strict accessibility rules.
 */
import nextVitals from 'eslint-config-next/core-web-vitals';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import { defineConfig } from 'eslint/config';

import { base } from './base.js';

/** @param {{ tsconfigRootDir: string }} options */
export function next({ tsconfigRootDir }) {
  return defineConfig(
    // Next's preset registers the react, react-hooks, jsx-a11y, import and @next plugins.
    nextVitals,
    ...base({ tsconfigRootDir }),
    {
      files: ['**/*.{ts,tsx}'],
      // Plugin already registered by Next's preset; we only raise the rule set to "strict".
      rules: { ...jsxA11y.flatConfigs.strict.rules },
    },
    {
      // shadcn/ui components are generated code we own but do not hand-write.
      files: ['components/ui/**'],
      rules: { '@typescript-eslint/no-unnecessary-condition': 'off' },
    },
  );
}
