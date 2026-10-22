# @repo/content

Schemas and loaders for `content/**`, plus the GitHub helpers the CMS uses to turn edits into pull requests. `apps/web` reads every page through this package; `apps/cms` reuses the schemas and GitHub layer.

## Exports

[`src/index.ts`](src/index.ts) re-exports `schemas`, `loaders`, `github`, `media` and `locales`. Each of those is also a subpath (`@repo/content/schemas`, `@repo/content/loaders`, and so on), and `@repo/content/basecamp` exposes the Basecamp release list, which `apps/web` syncs at build time.

## Scripts

```bash
pnpm --filter @repo/content validate       # validate content fixtures against the loaders
pnpm --filter @repo/content github-smoke   # GitHub App end-to-end smoke test
pnpm --filter @repo/content test           # node:test suite
pnpm --filter @repo/content check-types    # tsc --noEmit
```

`validate` walks the active locales and runs each loader against the on-disk fixtures, exiting non-zero on the first failure. `github-smoke` runs the full create branch, commit, open PR, query PR, close PR, delete branch lifecycle against a real repo named by `GITHUB_OWNER` and `GITHUB_REPO`; it needs GitHub App credentials and cleans up in a `finally` block.

## More

- [AGENTS.md](AGENTS.md): schema-change checklist and the rules agents have to follow
