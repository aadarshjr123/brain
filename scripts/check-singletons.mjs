// Fails when a package that must exist once in the install resolves to two versions.
// Two copies of typescript-eslint made ESLint refuse to load (learning issue #24);
// two copies of React or Zustand break hooks and shared stores at runtime.
// Reads the `packages:` section of pnpm-lock.yaml, which is exactly what `pnpm install --frozen-lockfile` installs.
import { readFileSync } from 'node:fs';

const MUST_BE_SINGLE = [
  'typescript-eslint',
  '@typescript-eslint/eslint-plugin',
  '@typescript-eslint/parser',
  'react',
  'react-dom',
  'zustand',
  '@reduxjs/toolkit',
  'd3-force',
];

const lock = readFileSync('pnpm-lock.yaml', 'utf8');
const section = lock.split(/^packages:\n/m)[1]?.split(/^\S/m)[0] ?? '';
// Keys look like `  react@19.3.1:` or `  '@typescript-eslint/parser@8.73.0':`
const keys = [...section.matchAll(/^ {2}'?(@?[^@'\s]+)@([^:'(\s]+)/gm)];

let failed = false;
for (const name of MUST_BE_SINGLE) {
  const versions = new Set(keys.filter(([, n]) => n === name).map(([, , v]) => v));
  if (versions.size > 1) {
    failed = true;
    console.error(`✗ ${name} resolves to ${versions.size} versions: ${[...versions].join(', ')}`);
  }
}
if (failed) {
  console.error('Align the versions, or add a pnpm override in pnpm-workspace.yaml.');
  process.exit(1);
}
console.log(`✓ ${MUST_BE_SINGLE.length} packages resolve to a single version`);
