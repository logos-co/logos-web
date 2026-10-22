# AGENTS.md

Rules for agents working in `apps/cms`. The root `AGENTS.md` also applies.

## Role

Payload CMS admin app on Next.js 16, Postgres-backed, port 3001, admin UI at `/admin`. Postgres is not the content source of truth: it stores users, sessions, drafts and PR cache only. Published content changes always ship as GitHub PRs targeting `develop`.

## Commands

Run from the repo root.

```bash
pnpm --filter cms dev              # next dev on :3001, schema auto-sync on
pnpm --filter cms build            # validate build env, regenerate import map, next build
pnpm --filter cms lint             # eslint, zero warnings
pnpm --filter cms check-types      # next typegen + tsc --noEmit
pnpm --filter cms test             # node:test suite
pnpm --filter cms generate-types   # regenerate @repo/types payload.ts
pnpm --filter cms generate-import-map # regenerate the Payload admin import map
pnpm --filter cms migrate:create   # generate a SQL migration from the current schema
pnpm --filter cms migrate:status   # list applied / pending migrations
pnpm --filter cms migrate          # apply pending migrations
```

Run `pnpm generate-types` from the root after any collection or schema change.

## Rules

- Collections live in `src/collections/`: users, media, pages, builder-hub-settings, builder-listing-settings, site-settings-content, site-navigation-content, site-footer-content, rfps, ideas, builder-resources, circles, circle-events, circle-initiatives, circle-resources, content-change-requests, site-publish-reservations.
- Do not write published content straight to Postgres. The 13 content collections mutate `content/**` through the GitHub PR workflow in `src/services/content-workflow/`.
- Use the existing helpers, never reimplement the PR flow: `save-as-pr.ts` plus `save-page-as-pr.ts`, `save-idea-as-pr.ts`, `save-rfp-as-pr.ts`, `save-circle-as-pr.ts`, `save-circle-event-as-pr.ts`, `save-circle-initiative-as-pr.ts`, `save-circle-resource-as-pr.ts`, `save-builder-resource-as-pr.ts`, `save-builder-hub-settings-as-pr.ts`, `save-builder-listing-settings-as-pr.ts`, `save-site-content-as-pr.ts`.
- CMS-generated content PRs target `develop`.
- If a collection edits content under `content/**`, keep the Payload collection, the `@repo/content` schema and loader, fixtures and generated types in sync. See `packages/content/AGENTS.md`.

## Caveats

- Keep the production env assertions in `payload.config.ts`: the app throws when `NEXT_PUBLIC_SERVER_URL` or `NEXT_PUBLIC_WEB_URL` is missing in a non-Vercel production build. Fix the environment, never weaken the check.
- The dev wrapper (`scripts/dev.ts`) refuses to run in deployment environments and auto-accepts Payload schema-push prompts. Production uses reviewed migrations, never schema push: `payload migrate` runs in `docker-entrypoint.sh`, and Payload never pushes when `NODE_ENV=production`.

## Docs

- [docs/environment.md](docs/environment.md): env var reference and required values
- [docs/deployment.md](docs/deployment.md): Docker, migrations, first admin, health check
- [docs/publishing.md](docs/publishing.md): site publish workflow and reservations
