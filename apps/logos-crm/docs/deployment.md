# Logos CRM deployment

How `apps/logos-crm` runs in Docker and how its schema gets applied. The files that define it are
[`compose.yaml`](../compose.yaml), [`Dockerfile`](../Dockerfile),
[`drizzle.config.ts`](../drizzle.config.ts) and [`.env.example`](../.env.example).

## Deployment model

Docker Compose is the only deployment setup in the repo. It runs a PostgreSQL service, a
short-lived setup container and the web service; there is no worker, SMTP, authentication proxy or
file volume.

Treat it as local or demo only. The app has no authentication and `compose.yaml` hard-codes the
database credentials (`logos`/`logos`). Both ports bind to `127.0.0.1`, and they should stay that
way until there is authentication and real secrets.

## Compose services

| Service     | What it does                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------- |
| `crm-db`    | PostgreSQL 17 (`postgres:17-alpine`), bound to `127.0.0.1:5434`, named volume `logos-crm-db`, readiness healthcheck |
| `crm-setup` | Waits for a healthy `crm-db`, runs `db:migrate` then `db:seed`, and exits                                           |
| `crm-web`   | The Next.js app on `127.0.0.1:3004`, healthcheck on `/api/health`, starts once `crm-setup` has succeeded            |

`crm-setup` and `crm-web` build the same image from [`Dockerfile`](../Dockerfile) with the repo root
as build context, and both connect as `postgresql://logos:logos@crm-db:5432/logos_crm`.

## Run

```bash
docker compose -f apps/logos-crm/compose.yaml up --build
```

Because `crm-setup` migrates and seeds before `crm-web` starts, a clean `up --build` gives you a
ready database and the CRM on `http://localhost:3004`.

## Image build

The image starts from `node:24-alpine` and enables pnpm 11.1.0 through corepack. It installs the
workspace, builds `@acid-info/logos-ui`, then builds the app with a placeholder `DATABASE_URL`
(`postgresql://build:build@localhost:5432/build`). The container runs
`pnpm --filter logos-crm start`, which is `next start --port 3004`.

## Migrations

drizzle-kit owns the migrations in [`drizzle/`](../drizzle). [`drizzle.config.ts`](../drizzle.config.ts)
reads the schema from `src/server/db/schema.ts` and connects to `DATABASE_URL`, falling back to
`postgresql://logos:logos@localhost:5434/logos_crm`, which is the Compose database.

```bash
pnpm --filter logos-crm db:generate   # write a new migration after changing schema.ts
pnpm --filter logos-crm db:migrate    # apply pending migrations
pnpm --filter logos-crm db:seed       # load the idempotent demo seed
```

Never edit the generated SQL by hand; change the schema and regenerate.

## Environment

[`src/server/env.ts`](../src/server/env.ts) validates the environment with Zod. The only variable is
`DATABASE_URL`, a PostgreSQL connection string. For local development outside Docker, copy
`.env.example` to `.env`.

## Backup and recovery

There is no backup or restore automation yet. Until there is a runbook, back up by hand with
standard PostgreSQL tools such as `pg_dump` against the `crm-db` service.
