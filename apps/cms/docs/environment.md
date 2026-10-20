# CMS environment variables

Reference for every environment variable the CMS reads. Sources: [`apps/cms/.env.example`](../.env.example), [`apps/cms/.env.docker.example`](../.env.docker.example), [`apps/cms/payload.config.ts`](../payload.config.ts), [`apps/cms/scripts/validate-production-build-env.ts`](../scripts/validate-production-build-env.ts) and the `build` task in [`turbo.json`](../../../turbo.json).

Two templates exist:

| File                  | Copy to                 | Used by                   |
| --------------------- | ----------------------- | ------------------------- |
| `.env.example`        | `apps/cms/.env`         | local dev                 |
| `.env.docker.example` | repo-root `.env.docker` | `docker-compose.prod.yml` |

Never commit a filled-in `.env` or `.env.docker`; secrets are injected at runtime, never baked into the image.

## Required to boot

| Variable         | Purpose                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_SECRET` | Required in every environment. Generate with `openssl rand -hex 32`. Production builds throw when unset. |
| `DATABASE_URL`   | Postgres connection string. `payload.config.ts` throws when unset.                                       |

## URLs

| Variable                 | Default                 | Notes                                                                                                                                                |
| ------------------------ | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3001` | Public CMS origin. Required in self-hosted (non-Vercel) production; the build throws when missing. On Vercel it falls back to `https://$VERCEL_URL`. |
| `NEXT_PUBLIC_WEB_URL`    | `http://localhost:3000` | Web frontend origin for CORS and CSRF. Required in self-hosted (non-Vercel) production.                                                              |

## Build time

| Variable                                        | Notes                                                                                                                                                                                                                                   |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`            | Stable Server Actions key. [`scripts/validate-production-build-env.ts`](../scripts/validate-production-build-env.ts) fails the build when missing. Generate with `openssl rand -base64 32` and reuse the same value across deployments. |
| `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_WEB_URL` | Inlined into the client bundle at build time. Changing them requires a rebuild.                                                                                                                                                         |

## Postgres tuning

| Variable                           | Default                                           | Notes                                                                                                               |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_DB_SCHEMA`                | `payload`                                         | Schema that scopes Payload tables; change it to share one database across environments (for example `payload_dev`). |
| `PAYLOAD_DB_POOL_MAX`              | `3` local and Vercel, `10` self-hosted production | Max Postgres clients per runtime.                                                                                   |
| `PAYLOAD_DB_CONNECTION_TIMEOUT_MS` | `5000`                                            | Connection timeout in milliseconds.                                                                                 |
| `PAYLOAD_DB_QUERY_TIMEOUT_MS`      | `15000`                                           | Query and statement timeout in milliseconds.                                                                        |
| `PAYLOAD_DB_IDLE_TIMEOUT_MS`       | `5000`                                            | Idle timeout in milliseconds.                                                                                       |
| `PAYLOAD_HEALTH_TIMEOUT_MS`        | `10000`                                           | Database timeout for the health endpoint, read by `src/app/(payload)/api/health/route.ts`.                          |

## Schema sync

| Variable          | Default | Notes                                                                                                                    |
| ----------------- | ------- | ------------------------------------------------------------------------------------------------------------------------ |
| `PAYLOAD_DB_PUSH` | `true`  | Auto-create or sync the schema on boot. Payload never pushes when `NODE_ENV=production`, so this only affects local dev. |

## GitHub PR workflow

Used by the Admin "Create PR" action. GitHub App installation credentials only; personal access tokens are rejected.

| Variable                        | Default    | Notes                                                                                                           |
| ------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------- |
| `GITHUB_OWNER`                  | none       | Required for "Create PR".                                                                                       |
| `GITHUB_REPO`                   | none       | Required for "Create PR".                                                                                       |
| `GITHUB_APP_ID`                 | none       | Required for "Create PR".                                                                                       |
| `GITHUB_APP_PRIVATE_KEY`        | none       | Required for "Create PR". Multiline key on one line with literal `\n` separators.                               |
| `GITHUB_INSTALLATION_ID`        | none       | Required for "Create PR".                                                                                       |
| `GITHUB_PR_BASE_BRANCH`         | `develop`  | Branch new content PRs open against.                                                                            |
| `GITHUB_STAGING_BRANCH`         | `develop`  | Long-lived staging branch.                                                                                      |
| `GITHUB_PRODUCTION_BRANCH`      | `master`   | Production branch, promoted to via a develop to master PR.                                                      |
| `GITHUB_CONTENT_BRANCH_PREFIX`  | `content/` | Prefix on every CMS-managed branch.                                                                             |
| `CONTENT_DIRECT_COMMIT_ENABLED` | `false`    | When false, the mutation service refuses direct commits to staging or production. Set `true` only in local dev. |

## Docker Compose

Read from repo-root `.env.docker` by `docker-compose.prod.yml`.

| Variable                                                                                 | Notes                                                                                                                                       |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`                                      | Credentials for the bundled Postgres. The compose file builds `DATABASE_URL` from these.                                                    |
| `CMS_PORT`                                                                               | Host port mapped to the container's `:3000` (default `3001`).                                                                               |
| `CMS_SYNC_ON_BOOT`                                                                       | Default `true`. Seeds or refreshes the CMS database from git `content/` on every boot; set `false` once editors manage content directly.    |
| `JENKINS_DEV_JOB_URL`, `JENKINS_PRODUCTION_JOB_URL`, `JENKINS_USER`, `JENKINS_API_TOKEN` | Optional. Passed to the container by the compose file but not read by the current CMS code, which publishes through GitHub Actions instead. |

The `PAYLOAD_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_WEB_URL`, `PAYLOAD_DB_SCHEMA`, `PAYLOAD_DB_POOL_MAX`, `PAYLOAD_DB_PUSH` and `GITHUB_*` variables also appear in `.env.docker.example` with the same semantics as above.
