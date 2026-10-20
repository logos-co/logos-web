# AGENTS.md

Rules for agents working in `apps/api`. The root `AGENTS.md` also applies.

## Role

Hosts the public intake endpoint for the funnel forms on `apps/web`:
`POST /api/public/afform-submit`, served on port 3003. A Next.js app with no
pages, no database and no authenticated area. Never render a page here and never
talk to a database directly: submissions are forwarded to Notion, and the steward
form is additionally forwarded to an n8n/Baserow webhook.

## Commands

Run from the repo root:

    pnpm --filter api dev          # http://localhost:3003
    pnpm --filter api test
    pnpm --filter api lint
    pnpm --filter api check-types

## Rules

- `src/app/api/public/afform-submit/route.ts` is the orchestrator: it validates,
  verifies the captcha once (tokens are single-use), then calls each destination
  lib. Destination logic lives in the libs, never in the route.
- `src/lib/notion/` and `src/lib/n8n/` stay independent. The only thing they
  share is the id to label maps in `src/lib/notion/maps.ts`; add no cross-imports.
- The option ids in `src/lib/notion/maps.ts` must match the option values in the
  form definitions under `apps/web/lib/funnel-forms/`. Change one and you change
  the other in the same PR.
- Values shared with `apps/web` (the hear-about question and options, the
  per-form profile label, the per-form required-field list) live in
  `@repo/funnel`. Do not duplicate them here.
- `REQUIRED_FIELDS_BY_FORM` (from `@repo/funnel`) is the only place a funnel field
  is marked required; `apps/web` builds its schema from the same list.
- Some option labels double as Notion property or select-option names (the
  hear-about question, `Profile`, `Skills`). Renaming one requires renaming the
  property or option in Notion first; see
  [docs/funnel/README.md](../../docs/funnel/README.md).
- `src/lib/public-cors.ts` is the only place that decides which origins may call
  `/api/public/*`.
- When you change the request flow, a Notion property written by
  `buildNotionProperties`, an env var, or the code layout, update
  `docs/architecture.md` and `docs/funnel/README.md` in the same PR.

## Gotchas

- If the target Notion database holds multiple data sources (Notion API
  2025-09-03+), set `NOTION_DATA_SOURCE_ID` to pin writes to one source, or
  submissions fail with `multiple_data_sources_for_database`.
- A page POST referencing a Notion property that does not exist on the target
  database is rejected. Add the matching property in Notion before you write it.
- `FUNNEL_INTAKE_NOTION_DISABLED` (truthy) skips the Notion write without code
  changes; the endpoint still returns `201`.

## Docs

- [docs/architecture.md](docs/architecture.md): endpoint internals, request
  handling, env vars
- [../../docs/funnel/README.md](../../docs/funnel/README.md): end-to-end flow,
  Notion schema, option maps. Read before changing form submissions.
