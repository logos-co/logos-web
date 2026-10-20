# Logos CRM deployment

How `apps/logos-crm` runs and how its schema is applied. The source of truth is
[`compose.yaml`](../compose.yaml), [`Dockerfile`](../Dockerfile), [`drizzle.config.ts`](../drizzle.config.ts),
and [`.env.example`](../.env.example).

## Deployment model

The only supported target is Docker Compose on a Logos-controlled Linux host. There is no worker
service, no SMTP, no authentication proxy, and no file volume today: the project runs one
PostgreSQL service, one short-lived setup step, and one web service.

## Compose services

| Service     | Responsibility                                                                                                      |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `crm-db`    | PostgreSQL 17 (`postgres:17-alpine`), bound to `127.0.0.1:5434`, named volume `logos-crm-db`, readiness healthcheck |
| `crm-setup` | One-shot container that runs `db:migrate` then `db:seed`, then exits                                                |
| `crm-web`   | The Next.js app, bound to `127.0.0.1:3004`, healthcheck on `/api/health`, starts after `crm-setup` completes        |

Both app containers build from [`Dockerfile`](../Dockerfile) with the repo root as context, and
connect to the database as `postgresql://logos:logos@crm-db:5432/logos_crm`.

## Run

```bash
docker compose -f apps/logos-crm/compose.yaml up --build
```

The CRM is then served at `http://localhost:3004`.

## Image build

The Dockerfile uses `node:24-alpine`, enables pnpm 11.1.0 via corepack, builds
`@acid-info/logos-ui` first, then builds the app with a placeholder `DATABASE_URL`, and starts it
with `pnpm --filter logos-crm start`.

## Migrations

Migrations are owned by drizzle-kit and stored in [`drizzle/`](../drizzle). The config in
[`drizzle.config.ts`](../drizzle.config.ts) points at `src/server/db/schema.ts` and defaults to
`postgresql://logos:logos@localhost:5434/logos_crm` when `DATABASE_URL` is not set.

- `pnpm --filter logos-crm db:generate` writes a new migration from a schema change.
- `pnpm --filter logos-crm db:migrate` applies pending migrations.
- `pnpm --filter logos-crm db:seed` loads the idempotent demo seed.

Never edit the generated SQL in `drizzle/` by hand; change the schema and regenerate. The compose
`crm-setup` service runs migrate and seed automatically, so a clean `up --build` produces a ready
database.

## Environment

The app validates its environment with [`src/server/env.ts`](../src/server/env.ts). The only
variable is `DATABASE_URL`, a PostgreSQL connection string. Copy `.env.example` to `.env` for local
development outside Docker.

## Backup and recovery

No backup or restore automation is included yet. Standard PostgreSQL tooling (`pg_dump` against the
`crm-db` volume) is the manual option until a runbook is added.
