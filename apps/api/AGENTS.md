# apps/api

Rules for agents working in `apps/api`. The root `AGENTS.md` also applies.

## Role

One route: `POST /api/public/afform-submit`, the intake endpoint for the three
funnel forms on `apps/web`, served on port 3003. No pages, no database, no auth.
Do not render a page here or reach a database directly: submissions go to
Notion, and the steward form also to an n8n/Baserow webhook.

## Commands

Run from the repo root:

    pnpm --filter api dev          # http://localhost:3003
    pnpm --filter api test
    pnpm --filter api lint
    pnpm --filter api check-types

## Rules

- Keep `src/app/api/public/afform-submit/route.ts` an orchestrator: parse,
  validate, verify the captcha once (tokens are single-use), then call the
  destination libs. Destination logic stays in `src/lib/notion/` and
  `src/lib/n8n/`.
- Keep the two destination libs independent. `src/lib/notion/maps.ts` is the
  only thing they share; add no cross-imports.
- The option ids in `src/lib/notion/maps.ts` must match the option values in
  the form definitions under `apps/web/lib/funnel-forms/`. Change both in the
  same PR.
- Read values shared with `apps/web` from `@repo/funnel` (the hear-about
  question and options, the profile label per form, the required fields per
  form). Do not copy them here.
- Mark a field required in `REQUIRED_FIELDS_BY_FORM` only; `apps/web` builds its
  zod schema from the same list.
- Some option labels double as Notion property or select-option names (the
  hear-about question, `Profile`, `Skills`). Rename the property or option in
  Notion first, then the label; see
  [docs/funnel/README.md](../../docs/funnel/README.md).
- Decide origin policy only in `src/lib/public-cors.ts`.
- Update `docs/architecture.md` and `docs/funnel/README.md` in the same PR when
  you change the request flow, a property written by `buildNotionProperties`,
  an env var or the file layout.

## Caveats

- When the target Notion database holds more than one data source (Notion API
  2025-09-03+), set `NOTION_DATA_SOURCE_ID` to pin writes to one source.
  Otherwise submissions fail with `multiple_data_sources_for_database`.
- Notion rejects a page POST that references a property the database does not
  have. Add the property in Notion before you write it.
- `FUNNEL_INTAKE_NOTION_DISABLED` (truthy) skips the Notion write without a code
  change; the endpoint still answers `201`.
- An unset `N8N_STEWARD_WEBHOOK_TOKEN` skips steward forwarding, and the skipped
  push is only logged.

## Docs

- [docs/architecture.md](docs/architecture.md): endpoint internals, request
  handling, env vars
- [../../docs/funnel/README.md](../../docs/funnel/README.md): end-to-end flow,
  Notion schema, option maps. Read it before changing form submissions.
