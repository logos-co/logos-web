# CMS deployment

How the CMS is built and run in production. Covers the Docker image in [`apps/cms/Dockerfile`](../Dockerfile), the compose stack in [`docker-compose.prod.yml`](../../../docker-compose.prod.yml), the entrypoint in [`apps/cms/docker-entrypoint.sh`](../docker-entrypoint.sh) and the SQL migrations in [`apps/cms/src/migrations`](../src/migrations).

The production image bundles the built monorepo and runs `next start`. The build context must be the monorepo root so pnpm can resolve workspace packages.

## Docker Compose (recommended)

Brings up the CMS plus a self-hosted Postgres on an internal network. From the repo root:

```bash
cp apps/cms/.env.docker.example .env.docker   # fill in real values
docker compose -f docker-compose.prod.yml --env-file .env.docker up -d --build
```

The compose file builds `DATABASE_URL` from the Postgres variables and connects over the internal network. Postgres is not published to the host by default. Put a reverse proxy (TLS termination) in front of `CMS_PORT` in production.

What is persisted:

- `pgdata` volume: Postgres data
- `cms_uploads` volume: uploaded media at `/app/apps/web/public/cms/uploads`

The container entrypoint applies database migrations before the server starts, so the schema is ready on first boot. See [Database migrations](#database-migrations).

## Standalone image

Build and run the image against an external Postgres (for example Supabase). Build from the repo root:

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY='<stable openssl rand -base64 32 value>'

docker build -f apps/cms/Dockerfile \
  --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
  --build-arg NEXT_PUBLIC_SERVER_URL=https://cms.logos.co \
  --build-arg NEXT_PUBLIC_WEB_URL=https://logos.co \
  -t logos-cms .
```

Run, injecting runtime secrets:

```bash
docker run -d --name logos-cms -p 3001:3000 \
  -e DATABASE_URL='postgresql://user:password@host:5432/db' \
  -e PAYLOAD_SECRET='<openssl rand -hex 32>' \
  -e NEXT_PUBLIC_SERVER_URL='https://cms.logos.co' \
  -e NEXT_PUBLIC_WEB_URL='https://logos.co' \
  -v cms_uploads:/app/apps/web/public/cms/uploads \
  logos-cms
```

`NEXT_PUBLIC_*` values are inlined into the client bundle at build time, so they must be the real public origins passed as `--build-arg`. `DATABASE_URL` and `PAYLOAD_SECRET` are not baked in; they are supplied at runtime, and the build never connects to the database.

## Database migrations

Payload never auto-syncs the schema (`push`) when `NODE_ENV=production`. Production schema is owned by the reviewed SQL migrations in [`src/migrations/`](../src/migrations/).

In Docker the [`entrypoint`](../docker-entrypoint.sh) runs `payload migrate` before `next start`. Migrations are idempotent (already-applied ones, tracked in the `payload-migrations` table, are skipped), so a fresh database is set up on first boot and restarts are no-ops.

Local dev uses schema auto-push instead (`PAYLOAD_DB_PUSH` defaults on), so you normally do not run migrations during development.

When you change a collection or schema, generate a migration and commit it alongside the code:

```bash
pnpm --filter cms migrate:create   # generate a new migration from the current schema
pnpm --filter cms migrate:status   # list applied / pending migrations
pnpm --filter cms migrate          # apply pending migrations (against the target database)
```

The generated file under `src/migrations/` and the updated `src/migrations/index.ts` must be committed: production applies exactly what is in that directory.

Caveats:

- A failed migration blocks the deploy. The entrypoint runs under `set -e`, so if `payload migrate` exits non-zero the container stops before serving traffic. Test against a staging database first.
- Single-instance assumption. The entrypoint migrates on every start. If you scale to more than one replica, run migrations as a separate one-shot step (or gate them behind a leader). The bundled compose file runs a single `cms` service, so this is safe as-is.

## First admin user

There is no environment variable for the initial admin account. The first admin is created interactively:

1. After the container boots and migrations run, the `users` table is empty.
2. Open `/admin` on the public CMS origin (`NEXT_PUBLIC_SERVER_URL`).
3. Payload serves a "Create first user" screen; the email and password entered there become the first admin account.

Additional accounts are created from the Users collection inside Admin.

Do this immediately after the first deploy. Until the first user exists, anyone who reaches `/admin` can claim the admin account, so keep `/admin` behind your reverse proxy or network controls until it is created.

## Health check

The image exposes a health endpoint used by Docker's `HEALTHCHECK`:

```text
GET /api/health
```

Vercel also pings it hourly via the cron in [`apps/cms/vercel.json`](../vercel.json).
