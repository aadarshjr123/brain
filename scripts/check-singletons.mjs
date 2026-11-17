// Fails when a package that must exist once in the install has two versions.
// Two copies of typescript-eslint made ESLint refuse to load (learning issue #24);
// two copies of React or Zustand break hooks and shared stores at runtime.
// Reads pnpm's virtual store, so it checks what is installed, not what package.json asks for.
import { readdirSync } from 'node:fs';

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

const store = readdirSync('node_modules/.pnpm');
let failed = false;
for (const name of MUST_BE_SINGLE) {
  const prefix = `${name.replace('/', '+')}@`;
  const versions = new Set(
    store.filter((dir) => dir.startsWith(prefix)).map((dir) => dir.slice(prefix.length).split('_')[0]),
  );
  if (versions.size > 1) {
    failed = true;
    console.error(`✗ ${name} is installed in ${versions.size} versions: ${[...versions].join(', ')}`);
  }
}
if (failed) {
  console.error('Align the versions, or add a pnpm override in pnpm-workspace.yaml.');
  process.exit(1);
}
console.log(`✓ ${MUST_BE_SINGLE.length} packages are single-version`);
