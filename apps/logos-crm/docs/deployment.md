# Logos CRM deployment

How `apps/logos-crm` runs in Docker and how its schema gets applied. The files that define it are
[`compose.yaml`](../compose.yaml), [`Dockerfile`](../Dockerfile),
[`drizzle.config.ts`](../drizzle.config.ts) and [`.env.example`](../.env.example).

## Deployment model

Docker Compose is the only deployment setup in the repo. It runs a PostgreSQL service, a
short-lived setup container and the web service; there is no worker, SMTP, authentication proxy or
file volume. There is no hosted deployment: the Vercel project `logos-crm` is being deleted.

Treat it as local or demo only. Access is one shared token (`CRM_AUTH_TOKEN`, see
[backend.md](backend.md#access-control)) and `compose.yaml` hard-codes the database credentials
(`logos`/`logos`). Both ports bind to `127.0.0.1`, and they should stay that way until there are
real secrets.

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
CRM_AUTH_TOKEN=$(openssl rand -hex 32) docker compose -f apps/logos-crm/compose.yaml up --build
```

Compose refuses to start without `CRM_AUTH_TOKEN` and prints "Set CRM_AUTH_TOKEN to the CRM access
token". The healthcheck uses `/api/health`, the one route the token does not cover.

Because `crm-setup` migrates and seeds before `crm-web` starts, a clean `up --build` gives you a
ready database and the CRM on `http://localhost:3004`. Every other page and `/api/v1` route answers
401 with a basic-auth prompt until you send the token: enter it as the password (any user name) in
the browser prompt, or send `Authorization: Bearer <token>` from a script.

## Image build

The image starts from `node:24-alpine` and enables pnpm 11.1.0 through corepack. It installs the
workspace, builds `@acid-info/logos-ui`, then builds the app with a placeholder `DATABASE_URL`
(`postgresql://build:build@localhost:5432/build`). The container runs
`next start --port 3004 -H 0.0.0.0` so the published port reaches it; the `dev` and `start` scripts
bind `127.0.0.1` instead.

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

[`src/server/env.ts`](../src/server/env.ts) validates `DATABASE_URL`, a PostgreSQL connection
string. `CRM_AUTH_TOKEN` is the shared access token read by [`src/proxy.ts`](../src/proxy.ts); it is
optional under `next dev` and required everywhere else. Once set, it is required under `next dev`
too. For local development outside Docker, copy `.env.example` to `.env`.

## Backup and recovery

There is no backup or restore automation yet. Until there is a runbook, back up by hand with
standard PostgreSQL tools such as `pg_dump` against the `crm-db` service.
