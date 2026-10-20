# @repo/config

Shared ESLint, TypeScript and Prettier presets for every workspace in the monorepo.

- ESLint: [`eslint/base.mjs`](eslint/base.mjs) (TypeScript-aware base) and [`eslint/next.mjs`](eslint/next.mjs) (Next.js apps).
- TypeScript: [`typescript/base.json`](typescript/base.json), [`typescript/next.json`](typescript/next.json) and [`typescript/react-library.json`](typescript/react-library.json).
- Prettier: [`prettier/index.mjs`](prettier/index.mjs), re-exported by the root [`prettier.config.mjs`](../../prettier.config.mjs).

The package `exports` map exposes `./eslint/base`, `./eslint/next` and `./prettier`. In practice apps import the ESLint config by relative path, for example `import nextConfig from '../../packages/config/eslint/next.mjs'`, and reference the TypeScript presets via `"extends": "../../packages/config/typescript/next.json"` in `tsconfig.json`.
