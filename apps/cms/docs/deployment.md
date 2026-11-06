# CMS deployment

How the CMS is built and run in production: the image in [`apps/cms/Dockerfile`](../Dockerfile), the compose stack in [`docker-compose.prod.yml`](../../../docker-compose.prod.yml), the entrypoint [`apps/cms/docker-entrypoint.sh`](../docker-entrypoint.sh) and the SQL migrations in [`apps/cms/src/migrations`](../src/migrations).

The image contains the built monorepo and runs `next start` on port 3000. Always build it with the repo root as the context, because pnpm has to resolve the workspace packages.

## Docker Compose (recommended)

The compose file runs the CMS next to its own Postgres on an internal network. From the repo root:

```bash
cp apps/cms/.env.docker.example .env.docker   # fill in real values
docker compose -f docker-compose.prod.yml --env-file .env.docker up -d --build
```

Compose assembles `DATABASE_URL` from the `POSTGRES_*` variables, and Postgres isn't published to the host. The CMS listens on `CMS_PORT` (default 3001); put a reverse proxy in front of it for TLS.

Two volumes hold the state: `pgdata` for Postgres and `cms_uploads` for uploaded media at `/app/apps/web/public/cms/uploads`.

On every start the entrypoint applies pending migrations (see [Database migrations](#database-migrations)), then syncs the database from the git `content/` directory unless `CMS_SYNC_ON_BOOT=false`. A failed sync logs a warning and the server starts anyway with the data it has.

## Standalone image

To run against an external Postgres such as Supabase, build the image yourself from the repo root:

```bash
export NEXT_SERVER_ACTIONS_ENCRYPTION_KEY='<stable openssl rand -base64 32 value>'

docker build -f apps/cms/Dockerfile \
  --build-arg NEXT_SERVER_ACTIONS_ENCRYPTION_KEY="$NEXT_SERVER_ACTIONS_ENCRYPTION_KEY" \
  --build-arg NEXT_PUBLIC_SERVER_URL=https://cms.logos.co \
  --build-arg NEXT_PUBLIC_WEB_URL=https://logos.co \
  -t logos-cms .
```

Then run it with the runtime secrets:

```bash
docker run -d --name logos-cms -p 3001:3000 \
  -e DATABASE_URL='postgresql://user:password@host:5432/db' \
  -e PAYLOAD_SECRET='<openssl rand -hex 32>' \
  -e NEXT_PUBLIC_SERVER_URL='https://cms.logos.co' \
  -e NEXT_PUBLIC_WEB_URL='https://logos.co' \
  -v cms_uploads:/app/apps/web/public/cms/uploads \
  logos-cms
```

Next.js inlines the `NEXT_PUBLIC_*` values into the client bundle, so pass the real public origins as `--build-arg`; changing them later means rebuilding. `DATABASE_URL` and `PAYLOAD_SECRET` are only read at runtime, and the build never connects to the database.

## Database migrations

Apply the `20261104_085127_resource_renames` migration before starting the resource rename recovery code. Budget one additional PostgreSQL connection per CMS instance for recovery and resource PR records. It closes after ten seconds idle.

Production schema comes from the reviewed SQL migrations in [`src/migrations/`](../src/migrations/). Payload never pushes the schema when `NODE_ENV=production`, whatever `PAYLOAD_DB_PUSH` says.

In Docker the [entrypoint](../docker-entrypoint.sh) runs `payload migrate` before `next start`. Payload records applied migrations in the `payload-migrations` table and skips them, so a fresh database is set up on first boot and a restart does nothing.

Local dev pushes the schema automatically (`PAYLOAD_DB_PUSH` defaults to on), so you rarely run migrations by hand. When you change a collection or the schema, generate a migration and commit it with the code:

```bash
pnpm --filter cms migrate:create   # generate a migration from the current schema
pnpm --filter cms migrate:status   # list applied and pending migrations
pnpm --filter cms migrate          # apply pending migrations to the target database
```

Commit both the new file in `src/migrations/` and the updated `src/migrations/index.ts`. Production applies exactly what is in that directory.

A failed migration stops the deploy: the entrypoint runs under `set -e`, so the container exits before it serves traffic. Try new migrations against a staging database first.

The entrypoint migrates on every start, which assumes a single instance. The bundled compose file runs one `cms` service, so that holds today. If you add replicas, run migrations as a separate one-shot step or gate them behind a leader.

## User roles

The `20261105_091120_user_roles` migration keeps the earliest existing account (ordered by creation time, then ID) as an administrator and makes all other existing accounts editors. Apply it before serving the new CMS version. Both the migration and its rollback operate only on the schema configured by `PAYLOAD_DB_SCHEMA` (default `payload`, see [environment](environment.md)). On a shared database, set `PAYLOAD_DB_SCHEMA` to the intended schema so accounts in other schemas stay unchanged. Confirm that the earliest account is accessible before deployment. Its administrator can grant the role to other trusted accounts after migration. Existing passwords and sessions are preserved, and authenticated requests read the current role from the database.

For local development, the [database adapter](../src/database/user-roles-adapter.ts) applies the same role transition before Payload's default schema push when the existing users table has no role column. The schema change and account transition are atomic. Subsequent starts preserve assigned roles, even if all administrators have been deliberately demoted. Production and migration commands still use the reviewed migration above. A database already synchronised by an older version with every account set to editor needs an explicit role assignment through a trusted local API script; restarting does not promote anyone.

New accounts default to editor. Administrators can create accounts, manage other accounts and assign roles. Editors can read and update their own profile, email and password, and continue using the content editing and publishing workflows. Only administrators can unlock accounts or delete other users. Administrators cannot delete their own account or change their own role.

Role updates go through the [user after-change hook](../src/collections/user-roles.ts) in the account update transaction, after validation and the account save succeed. In bulk updates, rejected accounts keep their roles while successfully saved accounts receive the requested changes. Direct adapter updates exclude the role so that Payload's login, logout, session refresh and password reset writes cannot restore a stale role. Trusted maintenance scripts that assign roles must use `payload.update`, rather than `payload.db.updateOne`.

## First admin user

No environment variable creates the first admin. After the first deploy, the `users` table is empty, and Payload shows a "Create first user" screen at `/admin` on the public CMS origin (`NEXT_PUBLIC_SERVER_URL`). The account created there gets the administrator role. The CMS serialises first registration, so concurrent requests cannot create a second account, and a later request to `/api/users/first-register` fails with 403. The administrator then adds further accounts from the Users collection; they start as editors.

**Create that account straight after the first deploy.** Until it exists, anyone who reaches `/admin` can claim it, so keep `/admin` behind the reverse proxy or network controls until then.

## Health check

Docker's `HEALTHCHECK` calls `GET /api/health`. Vercel also hits it hourly through the cron in [`apps/cms/vercel.json`](../vercel.json).
