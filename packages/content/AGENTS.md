# AGENTS.md

Rules for agents working in `packages/content` (`@repo/content`). The root `AGENTS.md` also applies.

## Role

Single source of truth for content schemas (Zod), typed loaders for `content/**`, GitHub mutation helpers and the active locale registry. `apps/web` reads content through the loaders; `apps/cms` reuses the schemas and GitHub helpers. Never duplicate schema or loader logic inside an app.

## When changing a schema

1. Update the Zod schema in `src/schemas/`.
2. Update or add the matching loader in `src/loaders/`.
3. Update fixtures under `content/**`.
4. If the CMS edits this collection, update the Payload collection in `apps/cms/src/collections/` and the workflow helper in `apps/cms/src/services/content-workflow/`.
5. Run `pnpm generate-types` (from the root) and `pnpm check-types`.

## Payload collections that mutate content via GitHub PR

These CMS collections write `content/**` through the GitHub PR workflow and must stay in sync with a schema and loader here: pages, ideas, rfps, circles, circle-events, circle-initiatives, circle-resources, builder-resources, builder-hub-settings, builder-listing-settings, site-settings-content, site-navigation-content, site-footer-content. Users, media, content-change-requests and site-publish-reservations never mutate `content/**`.

## Rules

- Schemas live in `src/schemas/` (Zod); loaders live in `src/loaders/`. Loaders fail loudly on a missing required locale file, so do not add silent fallbacks.
- Active locales come from `apps/web/i18n/routing.ts`. `src/locales/registry.ts` mirrors them and the app bootstraps the registry with `setActiveLocales`. Keep the registry default in sync when routing changes.
- GitHub helpers live in `src/github/`: App installation authentication only, no personal access tokens.
- Keep reusable types, constants, validators and helpers out of generated or oversized files.

## Commands

```bash
pnpm --filter @repo/content validate       # validate content fixtures against the loaders
pnpm --filter @repo/content github-smoke   # create-branch to close-PR lifecycle against a real repo
pnpm --filter @repo/content test           # node:test suite
pnpm --filter @repo/content check-types    # tsc --noEmit
```

## Gotchas

- `github-smoke` mutates a real repo via `GITHUB_OWNER` / `GITHUB_REPO` and GitHub App credentials; it cleans up in `finally`.
