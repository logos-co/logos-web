# AGENTS.md

Rules for agents working in `packages/content` (`@repo/content`). The root `AGENTS.md` also applies.

## Role

This package owns the content schemas (Zod), the typed loaders for `content/**`, the GitHub mutation helpers and the active locale registry. `apps/web` reads content through the loaders, `apps/cms` reuses the schemas and GitHub helpers. Never duplicate schema or loader logic inside an app.

## When changing a schema

1. Update the Zod schema in `src/schemas/`.
2. Update or add the matching loader in `src/loaders/`.
3. Update fixtures under `content/**`.
4. If the CMS edits this collection, update the Payload collection in `apps/cms/src/collections/` and the workflow helper in `apps/cms/src/services/content-workflow/`.
5. Run `pnpm generate-types` (from the root) and `pnpm check-types`.

These CMS collections write `content/**` through the GitHub PR workflow, so each one needs a schema and a loader here kept in step with it: pages, ideas, rfps, circles, circle-events, circle-initiatives, circle-resources, builder-resources, builder-hub-settings, builder-listing-settings, site-settings-content, site-navigation-content, site-footer-content. Users, media, content-change-requests and site-publish-reservations never mutate `content/**`.

## Rules

- Loaders fail loudly on a missing required locale file. Do not add silent fallbacks.
- Active locales come from `apps/web/i18n/routing.ts`. `src/locales/registry.ts` mirrors them and the app bootstraps the registry with `setActiveLocales`. Keep the registry default in sync when routing changes, and remember that a missing `setActiveLocales` call lets validation skip a newly added locale.
- GitHub helpers live in `src/github/` and authenticate as a GitHub App installation only. No personal access tokens.
- Keep reusable types, constants, validators and helpers out of generated or oversized files.

## Commands

```bash
pnpm --filter @repo/content validate       # validate content fixtures against the loaders
pnpm --filter @repo/content github-smoke   # create-branch to close-PR lifecycle against a real repo
pnpm --filter @repo/content test           # node:test suite
pnpm --filter @repo/content check-types    # tsc --noEmit
```

`github-smoke` mutates a real repo via `GITHUB_OWNER` / `GITHUB_REPO` and GitHub App credentials, and cleans up in `finally`.
