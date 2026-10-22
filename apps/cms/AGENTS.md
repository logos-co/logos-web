# apps/cms

Rules for agents working in `apps/cms`. The root `AGENTS.md` also applies.

## Role

Payload CMS admin on Next.js 16 and Postgres, port 3001, admin UI at `/admin`. Postgres holds users, sessions, drafts and the PR cache only. Published content lives in `content/**` and changes only through GitHub PRs against `develop`.

## Commands

Run from the repo root.

```bash
pnpm --filter cms dev                 # next dev on :3001, schema auto-sync on
pnpm --filter cms build               # check build env, regenerate import map, next build
pnpm --filter cms lint                # eslint, zero warnings
pnpm --filter cms check-types         # next typegen + tsc --noEmit
pnpm --filter cms test                # node:test suite
pnpm --filter cms generate-types      # regenerate @repo/types payload.ts
pnpm --filter cms generate-import-map # regenerate the Payload admin import map
pnpm --filter cms migrate:create      # new SQL migration from the current schema
pnpm --filter cms migrate:status      # applied and pending migrations
pnpm --filter cms migrate             # apply pending migrations
```

After any collection or schema change, run `pnpm generate-types` from the root and create a migration with `migrate:create`. Commit the new file in `src/migrations/` and the updated `src/migrations/index.ts`.

## Rules

- Collections live in `src/collections/`: users, media, pages, builder-hub-settings, builder-listing-settings, site-settings-content, site-navigation-content, site-footer-content, rfps, ideas, builder-resources, circles, circle-events, circle-initiatives, circle-resources, content-change-requests, site-publish-reservations.
- Never write published content straight to Postgres. The 13 content collections change `content/**` through the PR workflow in `src/services/content-workflow/`.
- Reuse the existing PR helpers instead of writing a new PR flow: `save-as-pr.ts` plus the per-collection `save-page-as-pr.ts`, `save-idea-as-pr.ts`, `save-rfp-as-pr.ts`, `save-circle-as-pr.ts`, `save-circle-event-as-pr.ts`, `save-circle-initiative-as-pr.ts`, `save-circle-resource-as-pr.ts`, `save-builder-resource-as-pr.ts`, `save-builder-hub-settings-as-pr.ts`, `save-builder-listing-settings-as-pr.ts` and `save-site-content-as-pr.ts`.
- When a collection edits `content/**`, keep the Payload collection, the `@repo/content` schema and loader, fixtures and generated types in sync. Follow `packages/content/AGENTS.md`.

## Caveats

- `payload.config.ts` throws when `NEXT_PUBLIC_SERVER_URL` or `NEXT_PUBLIC_WEB_URL` is missing in a production build outside Vercel. Fix the environment; don't weaken the check.
- `scripts/dev.ts` refuses to run when `NODE_ENV=production` or a Vercel env var is set, and it auto-accepts Payload's schema-push prompts. Deployed environments use reviewed migrations only: `docker-entrypoint.sh` runs `payload migrate`, and Payload never pushes the schema when `NODE_ENV=production`.

## Docs

- [docs/environment.md](docs/environment.md): env vars and defaults
- [docs/deployment.md](docs/deployment.md): Docker, migrations, first admin, health check
- [docs/publishing.md](docs/publishing.md): site publish workflow and reservations
