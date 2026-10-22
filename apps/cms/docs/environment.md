# CMS environment variables

Every environment variable the CMS reads, taken from [`apps/cms/.env.example`](../.env.example), [`apps/cms/.env.docker.example`](../.env.docker.example), [`apps/cms/payload.config.ts`](../payload.config.ts), [`apps/cms/scripts/validate-production-build-env.ts`](../scripts/validate-production-build-env.ts) and the `build` task in [`turbo.json`](../../../turbo.json).

There are two templates. Copy `.env.example` to `apps/cms/.env` for local dev, and `.env.docker.example` to `.env.docker` at the repo root for `docker-compose.prod.yml`. Never commit either filled-in file; secrets are passed at runtime and never baked into the image.

## Required to boot

| Variable         | Purpose                                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`   | Postgres connection string. `payload.config.ts` throws when it is unset.                                                                                     |
| `PAYLOAD_SECRET` | Generate with `openssl rand -hex 32`. `payload.config.ts` throws when it is unset and `NODE_ENV=production`; outside production it falls back to an insecure dev value. |

## URLs

| Variable                 | Default                 | Notes                                                                                                                                         |
| ------------------------ | ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SERVER_URL` | `http://localhost:3001` | Public CMS origin. Required in self-hosted production, where the build throws without it. On Vercel it falls back to `https://$VERCEL_URL`. |
| `NEXT_PUBLIC_WEB_URL`    | `http://localhost:3000` | Public web origin, used for CORS and CSRF. Required in self-hosted production.                                                                |

## Build time

[`scripts/validate-production-build-env.ts`](../scripts/validate-production-build-env.ts) fails `pnpm --filter cms build` when `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` is missing. Generate it once with `openssl rand -base64 32` and reuse the same value for every deployment, because it keeps Server Actions stable across deployments.

`NEXT_PUBLIC_SERVER_URL` and `NEXT_PUBLIC_WEB_URL` are inlined into the client bundle at build time, so changing either needs a rebuild.

## Postgres tuning

| Variable                           | Default                                           | Notes                                                                                                   |
| ---------------------------------- | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `PAYLOAD_DB_SCHEMA`                | `payload`                                         | Schema for the Payload tables. Set a different one, such as `payload_dev`, to share a database between environments. |
| `PAYLOAD_DB_POOL_MAX`              | `3` local and Vercel, `10` self-hosted production | Max Postgres clients per runtime.                                                                       |
| `PAYLOAD_DB_CONNECTION_TIMEOUT_MS` | `5000`                                            | Connection timeout.                                                                                     |
| `PAYLOAD_DB_QUERY_TIMEOUT_MS`      | `15000`                                           | Query and statement timeout.                                                                            |
| `PAYLOAD_DB_IDLE_TIMEOUT_MS`       | `5000`                                            | Idle timeout.                                                                                           |
| `PAYLOAD_HEALTH_TIMEOUT_MS`        | `10000`                                           | Database timeout for the health endpoint in `src/app/(payload)/api/health/route.ts`.                    |

All timeouts are in milliseconds.

## Schema sync

`PAYLOAD_DB_PUSH` defaults to `true` and makes Payload create or sync the schema on boot. Payload never pushes when `NODE_ENV=production`, so in practice it only affects local dev. Deployed environments use migrations; see [deployment.md](deployment.md#database-migrations).

## GitHub PR workflow

The Admin "Create PR" action needs these. It authenticates as a GitHub App installation and rejects personal access tokens.

| Variable                        | Default    | Notes                                                                                  |
| ------------------------------- | ---------- | -------------------------------------------------------------------------------------- |
| `GITHUB_OWNER`                  | none       | Required for "Create PR".                                                              |
| `GITHUB_REPO`                   | none       | Required for "Create PR".                                                              |
| `GITHUB_APP_ID`                 | none       | Required for "Create PR".                                                              |
| `GITHUB_APP_PRIVATE_KEY`        | none       | Required for "Create PR". Put the multiline key on one line with literal `\n`.         |
| `GITHUB_INSTALLATION_ID`        | none       | Required for "Create PR".                                                              |
| `GITHUB_PR_BASE_BRANCH`         | `develop`  | Branch that content PRs open against.                                                  |
| `GITHUB_STAGING_BRANCH`         | `develop`  | Long-lived staging branch.                                                             |
| `GITHUB_PRODUCTION_BRANCH`      | `master`   | Production branch, updated through a `develop` to `master` PR.                         |
| `GITHUB_CONTENT_BRANCH_PREFIX`  | `content/` | Prefix for every branch the CMS creates.                                               |
| `CONTENT_DIRECT_COMMIT_ENABLED` | `false`    | While false, the CMS refuses direct commits to the staging or production branch. Only set `true` in local dev. |

## Docker Compose

`docker-compose.prod.yml` reads these from `.env.docker` at the repo root.

| Variable                                                                                 | Notes                                                                                                                         |
| ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`                                      | Credentials for the bundled Postgres. Compose builds `DATABASE_URL` from them.                                                |
| `CMS_PORT`                                                                               | Host port mapped to the container's port 3000. Default `3001`.                                                                |
| `CMS_SYNC_ON_BOOT`                                                                       | Default `true`: every boot seeds or refreshes the database from git `content/`. Set `false` once editors manage content in Admin, or git content overwrites their changes on each boot. |
| `JENKINS_DEV_JOB_URL`, `JENKINS_PRODUCTION_JOB_URL`, `JENKINS_USER`, `JENKINS_API_TOKEN` | Optional. Compose passes them to the container, but the CMS code no longer reads them; it publishes through GitHub Actions.  |

`.env.docker.example` also lists `PAYLOAD_SECRET`, `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY`, `NEXT_PUBLIC_SERVER_URL`, `NEXT_PUBLIC_WEB_URL`, `PAYLOAD_DB_SCHEMA`, `PAYLOAD_DB_POOL_MAX`, `PAYLOAD_DB_PUSH` and the `GITHUB_*` variables, which behave as described above.
