# @repo/content

Shared content package: Zod schemas, typed loaders for `content/**`, GitHub mutation helpers and the active locale registry. `apps/web` loads site content through it; `apps/cms` reuses its schemas and GitHub helpers.

## Exports

The package entry ([`src/index.ts`](src/index.ts)) re-exports `schemas`, `loaders`, `github`, `media` and `locales`. The `exports` map also exposes the subpaths `./schemas`, `./loaders`, `./github`, `./media`, `./locales` and `./basecamp`.

## Scripts

```bash
pnpm --filter @repo/content validate       # validate content fixtures against the loaders
pnpm --filter @repo/content github-smoke   # GitHub App end-to-end smoke test
pnpm --filter @repo/content test           # node:test suite
pnpm --filter @repo/content check-types    # tsc --noEmit
```

`validate` walks the active locales and runs each loader against the on-disk fixtures, exiting non-zero on the first failure. `github-smoke` runs the full create branch, commit, open PR, query PR, close PR, delete branch lifecycle against a real repo.

## More

- [AGENTS.md](AGENTS.md): schema-change checklist and rules for agents
