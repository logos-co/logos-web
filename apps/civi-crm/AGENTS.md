# AGENTS.md

Guidance for agents working inside `apps/civi-crm`. The root `AGENTS.md` still applies; this file adds app-specific instructions for the nearest subtree.

## App Role

This app hosts the public intake endpoint for the funnel forms on `apps/web`: `POST /api/public/afform-submit`. It is a Next.js 16 app with no pages, no database and no authenticated area. Submissions are forwarded to Notion, and the steward form additionally to an n8n/Baserow webhook. Dev server runs on port **3002**.

The name is historical: this was the web layer on top of CiviCRM for Circle Case management. The CiviCRM instances were shut down and every interaction with them was removed in [logos-web#123](https://github.com/logos-co/logos-web/issues/123). Nothing reads the Keycloak proxy headers anymore, so the proxy that used to protect the case-management pages is no longer needed in front of this app.

**Architecture document:** [`docs/civi-crm/architecture.md`](../../docs/civi-crm/architecture.md)

**Funnel reference:** [`docs/funnel/AGENTS.md`](../../docs/funnel/AGENTS.md)
Read it before changing anything about form submissions. It documents the request flow, the Notion database schema, the id → label maps, and the newsletter opt-ins that run on the `apps/web` side.

## Keeping Docs Up to Date

When you make a structural change, update `docs/civi-crm/architecture.md` **and** this `AGENTS.md` in the same commit or PR if either is affected. Changes that require an architecture doc update:

- Adding, removing, or renaming files in the `src/` tree
- Adding, removing, or changing API routes
- Changing env var names or defaults
- Changing the shape of what is sent to Notion or n8n
- Changing commands or code-organization rules

Anything that changes the funnel behaviour also belongs in `docs/funnel/AGENTS.md`.

Minor implementation details (function bodies) do not require a doc update.

## Commands

Run from the repo root unless a task explicitly needs the app directory:

```bash
pnpm --filter civi-crm dev
pnpm --filter civi-crm build
pnpm --filter civi-crm lint
pnpm --filter civi-crm lint:fix
pnpm --filter civi-crm check-types
pnpm --filter civi-crm test
```

## Code Organization

- `src/app/api/public/afform-submit/route.ts` is the orchestrator: it validates, verifies the captcha once (tokens are single-use), then calls each destination lib. Destination logic belongs in the lib, not the route.
- `src/lib/notion/` and `src/lib/n8n/` are independent apart from the shared id → label maps in `src/lib/notion/maps.ts`. Do not add cross-imports.
- The option ids in `src/lib/notion/maps.ts` must match the option values in the form definitions under `apps/web/lib/funnel-forms/afform-*.ts`. Changing one means changing the other.
- Values shared with `apps/web` (the "How did you first hear about Logos?" question, its options, the per-form profile label, the per-form required-field list) live in `@repo/funnel`. Do not duplicate them here.
- `REQUIRED_FIELDS_BY_FORM` is where a funnel field is marked required. `apps/web` builds its form schema from the same list, so a field becomes required for both sides at once.
- `src/lib/public-cors.ts` is the only place that decides which origins may call `/api/public/*`.

## Environment

See `.env.example` for all variables. If Notion intake is enabled in a non-local environment, ensure `NOTION_API_TOKEN` and `NOTION_DB_ID` are set in that deployment. When the target database holds multiple data sources (Notion API 2025-09-03+), also set `NOTION_DATA_SOURCE_ID` to pin writes to one source; otherwise submissions fail with `multiple_data_sources_for_database`. You can opt out of the Notion write without code changes via `FUNNEL_INTAKE_NOTION_DISABLED`.
