# AGENTS.md

Rules for agents working in `apps/logos-crm`. The root `AGENTS.md` also applies.

## Role

A self-hosted CRM (Next.js 16, App Router, server runtime, port 3004) backed by its own PostgreSQL
database. It is not a static export, and it never calls the GitHub API or the public website.

## Commands

- `pnpm --filter logos-crm dev`: Next dev server on port 3004.
- `pnpm --filter logos-crm db:generate`: `drizzle-kit generate` (writes `drizzle/`).
- `pnpm --filter logos-crm db:migrate`: apply migrations to `DATABASE_URL`.
- `pnpm --filter logos-crm db:seed`: idempotent demo seed.
- `pnpm --filter logos-crm lint` and `check-types`.

## Rules

- `src/server/db/schema.ts` is the single source of truth for the database schema.
- Migrations live in `drizzle/` and are generated with `db:generate`. Never hand-edit the generated
  SQL; change `schema.ts` and regenerate.
- Shared request and response contracts are Zod schemas in `src/contracts/`. Infer types with
  `z.infer` instead of duplicating interfaces, and keep them browser-safe (no server imports).
- Data invariants are enforced in PostgreSQL (unique indexes and `CHECK` constraints), not only in
  the repository layer. Preserve them when changing the schema.
- Route handlers under `src/app/api/v1` stay thin: validate with the contract, call a repository in
  `src/server`, and map errors with `src/server/api-response.ts`.
- Server-only code (db, repositories, env) lives under `src/server` and must not be imported by
  client components.

## Caveats

- `cases.organisation` and `cases.owner` are denormalised free text, not foreign keys; the link
  tables `case_organisations` and `case_people` carry the real relationships.
- `activities` and `tasks` each require exactly one subject (case, person, or organisation) via a
  Postgres `CHECK`. Create rows through `work-repository.ts`, not raw inserts.
- The `version` column on directory rows exists but is not yet used for concurrency control.
- There is no authentication and `compose.yaml` hard-codes the database credentials. Keep both
  ports bound to `127.0.0.1`; never present the setup as safe to expose publicly.
- next-intl is configured with a single `en` locale, but only page metadata is localised today; UI
  copy is hardcoded in components. Route new user-facing strings through `messages/en.json`.

## Docs

- [docs/architecture.md](docs/architecture.md): overall shape and what is not built yet.
- [docs/data-model.md](docs/data-model.md): tables, columns, constraints, and indexes.
- [docs/backend.md](docs/backend.md): contracts, repositories, and API routes.
- [docs/frontend.md](docs/frontend.md): screens, components, and client data.
- [docs/deployment.md](docs/deployment.md): Docker Compose, the Dockerfile, and migrations.
