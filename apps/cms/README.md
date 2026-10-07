# Logos CMS

Payload CMS 3.83 admin app on Next.js 16. Admin UI lives at `/admin`, the app runs on port **3001**.

Postgres is **not** the production source of truth for content — it stores users, sessions, drafts, and PR cache. Published content changes flow through the GitHub "Create PR" workflow targeting `develop`. See [`AGENTS.md`](./AGENTS.md) for the content-workflow rules.

---

## Prerequisites

- Node.js `>=24 <25`
- pnpm `11.1.0` (via Corepack: `corepack enable`)
- A reachable Postgres instance (local, Supabase, or the bundled Docker Postgres)
- For Docker deploys: Docker + Docker Compose

All commands run **from the monorepo root** so pnpm can resolve workspace packages (`@repo/content`, etc.).

---

## Development

Local development runs `next dev` directly against your own Postgres, with Payload schema auto-sync enabled.

### 1. Configure environment

```bash
cp apps/cms/.env.example apps/cms/.env
```

Fill in at minimum:

| Variable | Purpose |
| --- | --- |
| `PAYLOAD_SECRET` | Required to boot. Generate with `openssl rand -hex 32`. |
| `DATABASE_URL` | Postgres connection string. |
| `NEXT_PUBLIC_SERVER_URL` | CMS origin — defaults to `http://localhost:3001`. |
| `NEXT_PUBLIC_WEB_URL` | Web frontend origin — defaults to `http://localhost:3000`. |

The `GITHUB_*` variables are only required to exercise the Admin "Create PR" action. See [`.env.example`](./.env.example) for every option and its default.

> Isolate dev data from other environments by setting `PAYLOAD_DB_SCHEMA=payload_dev` when sharing one Postgres database.

### 2. Run

```bash
pnpm --filter cms dev          # from the repo root
# or
pnpm dev:cms                   # turbo wrapper (also builds workspace deps)
```

The dev wrapper (`scripts/dev.ts`) starts Next on port 3001 and auto-accepts Payload's interactive schema-push prompt. It **refuses to run in deployment environments** — production/staging must use the build/start path with reviewed migrations, never local dev schema sync.

### Common tasks

```bash
pnpm --filter cms lint               # eslint, zero warnings
pnpm --filter cms check-types        # payload typegen + tsc --noEmit
pnpm --filter cms test               # node:test suite
pnpm --filter cms generate-types     # regenerate Payload types after schema changes
pnpm --filter cms generate-import-map
```

Run `generate-types` after any Payload collection or schema change that affects generated types.

---

## Production deployment (Docker)

The production image bundles the built monorepo and runs `next start`. The build context **must be the monorepo root** so pnpm can resolve workspace packages.

### Option A — Docker Compose (recommended)

Brings up the CMS plus a self-hosted Postgres on an internal network. From the repo root:

```bash
# 1. Create the env file and fill in real values
cp apps/cms/.env.docker.example .env.docker

# 2. Build and start
docker compose -f docker-compose.prod.yml --env-file .env.docker up -d --build
```

Required values in `.env.docker`:

| Variable | Notes |
| --- | --- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | Credentials for the bundled Postgres. |
| `PAYLOAD_SECRET` | `openssl rand -hex 32`. |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **Build time** stable Server Actions key. Generate with `openssl rand -base64 32`. Use the same value across CMS deployments. |
| `NEXT_PUBLIC_SERVER_URL` | **Baked into the client bundle at build time** — must be the real public CMS origin. Changing it requires a rebuild. |
| `NEXT_PUBLIC_WEB_URL` | **Build-time** public web origin (same caveat). |
| `CMS_PORT` | Host port mapped to the container's `:3000` (default `3001`). |

The compose file constructs `DATABASE_URL` automatically from the Postgres vars and connects over the internal network — Postgres is **not** published to the host by default.

What's persisted:

- **`pgdata`** volume — Postgres data
- **`cms_uploads`** volume — uploaded media (`/app/apps/web/public/cms/uploads`)

The container entrypoint applies database migrations before the server starts, so the schema is ready on first boot — no manual step needed. See [Database migrations](#database-migrations) below for how this works and how to add a migration.

Put a reverse proxy (TLS termination) in front of `CMS_PORT` in production.

### Option B — standalone image

Build and run the image against an external Postgres (e.g. Supabase). Build from the repo root:

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

> `NEXT_PUBLIC_*` are inlined into the client bundle at **build time**, so they must be the real public origins passed as `--build-arg`. `DATABASE_URL` and `PAYLOAD_SECRET` are **not** baked in — they're supplied at runtime, and the build never connects to the database.

### Build vs. runtime variables

| Variable | When it's read | Notes |
| --- | --- | --- |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | **Build time** | Stable key required by Next Server Actions across CMS deployments. |
| `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_WEB_URL` | **Build time** (inlined into client bundle) | Must be real public origins; changing requires a rebuild. |
| `DATABASE_URL`, `PAYLOAD_SECRET` | **Runtime** | Never baked into the image. |
| `PAYLOAD_DB_SCHEMA`, `PAYLOAD_DB_POOL_MAX` | Runtime | Defaults: `payload`, `10`. |
| `PAYLOAD_DB_PUSH` | Runtime | Only affects **local dev** (`NODE_ENV !== production`). Ignored in production — see [Database migrations](#database-migrations). |
| `GITHUB_*` | Runtime | Optional — only for the Admin "Create PR" action. |

For Vercel CMS deployments, set `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` as a
project environment variable for production and preview builds.

### Database migrations

Payload **never** auto-syncs the schema (`push`) when `NODE_ENV=production` — that includes both self-hosted Docker and Vercel. Production schema is owned entirely by the reviewed SQL migrations in [`src/migrations/`](./src/migrations/).

**How it runs in Docker:** the container's [entrypoint](./docker-entrypoint.sh) runs `payload migrate` before `next start`. Migrations are idempotent — already-applied ones (tracked in the `payload-migrations` table) are skipped — so a fresh database is set up on first boot and restarts are no-ops.

**Local dev** uses schema auto-push instead (`PAYLOAD_DB_PUSH` defaults on; set `PAYLOAD_DB_PUSH=false` to disable), so you normally don't run migrations during development.

**When you change a collection or schema**, generate a migration and commit it alongside the code:

```bash
pnpm --filter cms migrate:create   # generate a new migration from current schema
pnpm --filter cms migrate:status   # list applied / pending migrations
pnpm --filter cms migrate          # apply pending migrations (run against the target DB)
```

The generated file under `src/migrations/` and the updated `src/migrations/index.ts` **must be committed** — production applies exactly what's in that directory.

**Caveats:**

- **A failed migration blocks the deploy.** The entrypoint runs under `set -e`, so if `payload migrate` exits non-zero the container stops before serving traffic. Test migrations against a staging database first.
- **Single-instance assumption.** The entrypoint migrates on every container start. If you scale the CMS to more than one replica, run migrations as a separate one-shot step (or gate them behind a leader) so replicas don't migrate the same database concurrently — the bundled `docker-compose.prod.yml` runs a single `cms` service, so this is safe as-is.

### First admin user

There is **no environment variable** for the initial admin account — Payload never bakes credentials into the image or config. The first admin is created interactively:

1. After the container boots and migrations run, the `users` table is empty.
2. Open `/admin` on the public CMS origin (`NEXT_PUBLIC_SERVER_URL`, e.g. `https://cms.logos.co`).
3. Payload serves a **"Create first user"** screen — the email / password you enter there becomes the first admin account.

Additional accounts are created afterward from the **Users** collection inside Admin.

> **Do this immediately after the first deploy.** Until the first user exists, anyone who reaches `/admin` can claim the admin account. Keep `/admin` behind your reverse proxy / network controls until you've created it.

### Health check

The image exposes a health endpoint used by Docker's `HEALTHCHECK`:

```
GET /api/health
```

---

## Environment file reference

| File | Used by | Committed? |
| --- | --- | --- |
| [`.env.example`](./.env.example) | Local dev template → copy to `apps/cms/.env` | template only |
| [`.env.docker.example`](./.env.docker.example) | Docker Compose template → copy to repo-root `.env.docker` | template only |

Never commit the filled-in `.env` / `.env.docker` files — secrets are injected at runtime, never baked into the image.

## Manual article publishing

Publish articles in [Strapi](https://cms-press.logos.co/admin), then select **Build staging** in the Payload dashboard's **Staging** card. The CMS uses its existing GitHub App to send a `repository_dispatch` request to `.github/workflows/site-publish.yml`. GitHub Actions captures published media once, builds the static site from `develop`, and updates `deploy-develop`. Review `dev.logos.co` with **View staging**, then select **Publish live** in the **Live** card and confirm the reviewed run. Production builds from `master` using that successful staging run's media snapshot; later Strapi edits are not fetched during the live build. **View live** opens `logos.co`. Editors do not need Jenkins access.

Before enabling the buttons:

- Merge the workflow to the default `develop` branch and deploy the updated CMS code.
- Give the existing CMS GitHub App **Contents: read and write**, **Pull requests: read and write**, **Metadata: read**, and **Actions: read** access. Accept any installation permission update. Dispatch uses Contents permission; status and snapshot availability checks use Actions permission.
- Keep the existing `STRAPI_API_KEY` and `SIMPLECAST_ACCESS_TOKEN` repository Actions Secrets. Set the repository Actions variable `SITE_PUBLISH_APP_ID` to the existing CMS App ID and the Actions Secret `SITE_PUBLISH_APP_PRIVATE_KEY` to a dedicated private key generated for that same App. No new CMS host or Vault variables are required. The workflow creates a short-lived, repository-scoped installation token with Contents write access immediately before publishing and revokes it at job completion.
- Add the installed **CMS GitHub App** to the push allowlist for `deploy-master`, preserving `status-im-auto` and all other branch protections. The default Actions token does not bypass this restriction. The workflow's default `GITHUB_TOKEN` only reads source, workflow history and artifacts; the App token publishes the static export.
- Keep both existing site push webhooks and the site's Git synchronisation enabled. The workflow checks the deployed `site-publish.json` marker before reporting success. Jenkins code deployments remain separate and keep their existing behaviour.

Snapshots are private Actions artifacts retained for 14 days and archived only after a successful staging publication. Live publishing rechecks that the selected run is the latest successful staging preview from this workflow and that its snapshot still exists. Missing or expired snapshots require a new staging build. The snapshot is never placed in the public export. Remote media URLs remain external assets, rather than immutable copies of every remote resource.

The CMS reserves one request atomically in Postgres across both environments and all replicas. It keeps the reservation until GitHub Actions reports a newer run; confirmed rejected submissions release it. Lost responses retain the reservation because GitHub may have accepted the request. Apply the existing reservation migration before enabling the buttons. If submission is interrupted and no run appears, an operator must verify that no site publishing workflow is pending or running before removing the stale row from `payload.site_publish_reservations` (or the configured Payload schema). Reservations do not expire automatically.

The workflow serialises staging and live publications and uses fast-forward pushes. It records the deployment branch before building and rejects a publish if another publisher has changed it. Live also checks the staging deployment marker and rejects a preview replaced by Jenkins or another publisher, including changes during the live build. Build failures are shown in the appropriate dashboard card; disabled actions include a short visible reason and an accessible description.
