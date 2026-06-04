# AGENTS.md

Guidance for agents working inside `apps/civi-crm`. The root `AGENTS.md` still applies; this file adds app-specific instructions for the nearest subtree.

## App Role

This is the Logos CiviCRM web layer — a Next.js 16 internal tool for managing Circle Case onboarding through a cleaner, custom interface on top of CiviCRM. It uses Tailwind v4, `@acid-info/logos-ui`, and `@acid-info/logos-tokens`. No database — CiviCRM is the sole data store. Authentication is handled by a Keycloak reverse proxy. Dev server runs on port **3002**.

**Architecture document:** [`docs/civi-crm/architecture.md`](../../docs/civi-crm/architecture.md)
Read it before designing any feature. It defines the view config system, API layer, auth seam, activity logging, caching, and all key architectural decisions.

**CiviCRM API guide:** [`docs/civi-crm/api.md`](../../docs/civi-crm/api.md)
Read it before writing any CiviCRM query. It documents every entity and field used by this app, valid operators, query patterns, and anti-patterns.

## Keeping Docs Up to Date

When you make a structural change, update `docs/civi-crm/architecture.md` **and** this `AGENTS.md` in the same commit or PR if either is affected. When adding or modifying CiviCRM queries, update `docs/civi-crm/api.md` if the change introduces a new entity, field, or pattern not yet documented. Changes that require an architecture doc update:

- Adding, removing, or renaming files in the `src/` tree
- Adding, removing, or changing API routes
- Changing the view config schema (`src/lib/views.ts`)
- Changing env var names or defaults
- Changing the CiviCRM client interface (`src/lib/civicrm/client.ts`)
- Changing commands or code-organization rules

Minor implementation details (function bodies, component internals) do not require a doc update.

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

- `src/lib/views.ts` is the **central extensibility primitive**. All field rendering, query construction (`select[]` arrays), and write fan-out derive from the active view config. Do not hardcode CiviCRM field paths or field lists outside this file.
- `src/lib/auth.ts` is the **single seam** for user identity. Do not read Keycloak headers or `DEV_USER_EMAIL_MOCK` anywhere else.
- `src/lib/civicrm/client.ts` is the **only place** that makes HTTP calls to CiviCRM. Do not call CiviCRM directly from route handlers or Server Actions.
- `src/lib/civicrm/scorecard.ts` is a pure function — keep it free of I/O so it stays trivially testable.
- `src/app/api/` route handlers call lib functions; they never instantiate `CiviCRMClient` directly.
- Mutations flow through Server Actions in `src/app/cases/[id]/actions.ts`. Do not call PATCH routes via client-side fetch.
- `src/lib/activity-logger.ts` is called only after **all** writes succeed. Never call it on partial or failed writes.
- Shared UI primitives come from `@acid-info/logos-ui`. If a primitive is missing, add it to `packages/ui` rather than creating a local copy.
- Use `src/constants/pagination.ts` (`PAGE_SIZE = 20`) for all paginated queries — do not hardcode the value.

## Environment

See `.env.local.example` for all required variables.

- **Local development**: set `DEV_USER_EMAIL_MOCK` in `.env.local` to mock Keycloak identity. This variable must not be set in staging or production.
- **Intake funnel (public endpoint)**: `POST /api/public/afform-submit` is used by the three connect forms on `apps/web`. If Notion intake is enabled in a non-local environment, ensure `NOTION_API_TOKEN` and `NOTION_DB_ID` are set in that deployment. You can opt out per destination without code changes via `FUNNEL_INTAKE_NOTION_DISABLED` and `FUNNEL_INTAKE_CIVICRM_DISABLED`.
