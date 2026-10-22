# apps/logos-crm

Rules for agents working in `apps/logos-crm`. The root `AGENTS.md` also applies.

## Role

Self-hosted CRM on Next.js 16 (App Router, `next start`, port 3004) with its own PostgreSQL
database. It is not a static export and never calls the GitHub API or the public website.

## Commands

- `pnpm dev:logos-crm`: dev server on port 3004, after building workspace deps.
- `pnpm --filter logos-crm db:generate`: `drizzle-kit generate` into `drizzle/`.
- `pnpm --filter logos-crm db:migrate`: apply migrations to `DATABASE_URL`.
- `pnpm --filter logos-crm db:seed`: idempotent demo seed.
- `pnpm --filter logos-crm lint` and `check-types`.

## Rules

- Change the database only in `src/server/db/schema.ts`, then run `db:generate`. Never hand-edit
  the SQL in `drizzle/`.
- Keep data invariants in PostgreSQL (unique indexes, `CHECK` constraints) as well as in the
  repositories. Don't drop them when changing the schema.
- Put request and response shapes in `src/contracts/` as Zod schemas and get types with `z.infer`.
  Contracts must stay browser-safe: no server imports.
- Keep route handlers under `src/app/api/v1` thin: parse with the contract, call a repository in
  `src/server`, and turn errors into responses with `apiException` from `src/server/api-response.ts`.
- Never import `src/server` (db, repositories, env) from client components.
- Route new user-facing strings through `messages/en.json`, even though most existing UI copy is
  hardcoded.

## Caveats

- `crm_cases.organisation` and `crm_cases.owner` are free-text display values, not foreign keys.
  The real links are in `crm_case_organisations` and `crm_case_people`.
- Activities and tasks need exactly one subject (case, person or organisation), enforced by a
  Postgres `CHECK`. Create them through `work-repository.ts`, not raw inserts.
- The `version` column on people and organisations is never read or incremented.
- There is no authentication and `compose.yaml` hard-codes the database credentials. Keep both
  ports bound to `127.0.0.1` and never describe the setup as safe to expose.

## Docs

- [docs/architecture.md](docs/architecture.md): overall shape and what is not built yet.
- [docs/data-model.md](docs/data-model.md): tables, columns, constraints and indexes.
- [docs/backend.md](docs/backend.md): contracts, repositories and API routes.
- [docs/frontend.md](docs/frontend.md): screens, components and client data.
- [docs/deployment.md](docs/deployment.md): Docker Compose, the Dockerfile and migrations.
