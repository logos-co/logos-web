# @repo/config

ESLint, TypeScript and Prettier presets shared by every workspace in the monorepo.

Workspaces use the presets by relative path, not by package name. The ESLint config goes into the workspace's `eslint.config.mjs`, choosing [`eslint/base.mjs`](eslint/base.mjs) for TypeScript packages or [`eslint/next.mjs`](eslint/next.mjs) for Next.js apps:

```js
import nextConfig from '../../packages/config/eslint/next.mjs'

export default [
  { ignores: ['next-env.d.ts'] },
  ...nextConfig,
]
```

`tsconfig.json` extends one of [`typescript/base.json`](typescript/base.json), [`typescript/next.json`](typescript/next.json) or [`typescript/react-library.json`](typescript/react-library.json) with `"extends": "../../packages/config/typescript/next.json"`.

Prettier settings live in [`prettier/index.mjs`](prettier/index.mjs): no semicolons, single quotes, ES5 trailing commas. The root [`prettier.config.mjs`](../../prettier.config.mjs) re-exports them, so Prettier picks them up when you run it from the repo root.

The `exports` map declares `./eslint/base`, `./eslint/next` and `./prettier`, but nothing imports `@repo/config/...` today. A new workspace should follow the relative-path pattern above instead of importing the package by name.
