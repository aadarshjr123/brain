// @ts-check
/**
 * Base ESLint preset for every TypeScript package.
 * Type-aware rules (typescript-eslint strictTypeChecked) are part of the review gate, see ADR-0008.
 */
import js from '@eslint/js';
import prettier from 'eslint-config-prettier/flat';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

/** @param {{ tsconfigRootDir: string }} options */
export function base({ tsconfigRootDir }) {
  return defineConfig(
    globalIgnores(['**/dist/**', '**/.next/**', '**/coverage/**', '**/.turbo/**', '**/next-env.d.ts']),
    js.configs.recommended,
    tseslint.configs.strictTypeChecked,
    tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      linterOptions: { reportUnusedDisableDirectives: 'error' },
      rules: {
        '@typescript-eslint/consistent-type-imports': ['error', { fixStyle: 'separate-type-imports' }],
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
        '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
        'no-console': ['warn', { allow: ['warn', 'error'] }],
        eqeqeq: ['error', 'smart'],
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      extends: [tseslint.configs.disableTypeChecked],
    },
    prettier,
  );
}
