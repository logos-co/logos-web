# Deployment Guide

Operational notes for deploying `apps/web` and `apps/cms`. The full architectural plan lives in [cms-github-content-plan.md](./cms-github-content-plan.md); this document covers only what is needed to make a green deploy.

## 0. Deployment Targets

| Environment | Host | Purpose |
| --- | --- | --- |
| **Development / staging** | Vercel (`acidinfo` team — `logos-co-web`, `logos-co-cms`) | Per-PR previews, fast iteration, cheap |
| **Production** | **Self-hosted Node** (Next.js standalone build) | Stable home for the public web + editor CMS |

The codebase is vendor-neutral. The CMS still falls back to `VERCEL_URL` for its own `serverURL` so per-deploy preview URLs work without manual config; everything else (frontend URL, web app site URL) requires explicit `NEXT_PUBLIC_SERVER_URL` / `NEXT_PUBLIC_WEB_URL` / `NEXT_PUBLIC_SITE_URL`. The Postgres adapter, schemas, loaders, and admin UI have no runtime dependency on Vercel.

In production-like environments outside Vercel, the CMS refuses to boot when `NEXT_PUBLIC_SERVER_URL` or `NEXT_PUBLIC_WEB_URL` is missing — silently falling back to localhost in a self-hosted prod cluster would break CORS and cookie scoping in non-obvious ways.

Sections 1–8 below describe the **Vercel dev/staging** path. Section 9 covers **self-hosted production**.

## 1. The Two Apps

| App | Vercel project (dev/staging) | Purpose | DB needed? |
| --- | --- | --- | --- |
| `apps/web` | `logos-co-web` | Public marketing site | No — reads `content/**` at build time |
| `apps/cms` | `logos-co-cms` | Payload Admin + REST/GraphQL API | Yes — Payload stores users, sessions, drafts, PR cache |

`apps/cms` does **not** own production page content. The repository's `content/` directory is the source of truth (see plan §1). Payload's database is for editor state only.

## 2. Known Issue: SQLite on Vercel (resolved)

Symptom previously observed at `https://logos-co-cms.vercel.app/api/pages`:

```json
{"message":"There was an error initializing Payload"}
```

Root cause: the original CMS config defaulted to SQLite (`DATABASE_URL=file:./cms.db`). Vercel's serverless filesystem is read-only outside `/tmp`, and `/tmp` is per-instance ephemeral. Payload tried to open / create the file at boot, the underlying driver failed, and Payload bailed out with the generic "error initializing" message.

The CMS now ships with `@payloadcms/db-postgres` and refuses to boot without a `DATABASE_URL`, printing actionable text in deploy logs:

```text
DATABASE_URL is required (postgresql:// connection string).
For local dev copy apps/cms/.env.example to apps/cms/.env and fill it in.
```

## 3. Required Environment Variables (apps/cms on Vercel)

| Variable | Required | Notes |
| --- | --- | --- |
| `PAYLOAD_SECRET` | yes | `openssl rand -hex 32`. Used for cookies / JWTs. Production build throws when unset. |
| `DATABASE_URL` | yes | Postgres connection string. Supabase pooler URLs (port 6543) work directly. |
| `PAYLOAD_DB_SCHEMA` | optional | Schema name scoping Payload tables. Defaults to `payload`. Use a distinct value per env when sharing one database (e.g. `payload_preview`). |
| `PAYLOAD_DB_POOL_MAX` | optional | Max Postgres clients per CMS runtime. Defaults to `1` on Vercel, `3` locally, `10` on self-hosted production. Keep Vercel low with Supabase pooler limits. |
| `PAYLOAD_DB_CONNECTION_TIMEOUT_MS` | optional | Postgres connect timeout. Defaults to `5000` to fail fast instead of waiting for the Vercel runtime timeout. |
| `PAYLOAD_DB_QUERY_TIMEOUT_MS` | optional | Postgres query and statement timeout. Defaults to `15000`. |
| `PAYLOAD_DB_IDLE_TIMEOUT_MS` | optional | Idle pool client timeout. Defaults to `5000`. |
| `PAYLOAD_HEALTH_TIMEOUT_MS` | optional | Per-step `/api/health` timeout. Defaults to `10000`, and reports whether `getPayload` or the DB read timed out. |
| `PAYLOAD_DB_PUSH` | optional | When `false`, disables automatic schema sync. Default behaviour pushes schema changes on every boot — leave it on until proper migrations are wired up (Phase 4+). |
| `GITHUB_OWNER` | required (Phase 4+) | Repo owner / org for the content repository (this repo). |
| `GITHUB_REPO` | required (Phase 4+) | Repo name. |
| `GITHUB_APP_ID` | required (App auth) | GitHub App ID. Preferred mode for staging/production. |
| `GITHUB_APP_PRIVATE_KEY` | required (App auth) | Multiline PEM. In Vercel paste verbatim — Vercel preserves newlines. In local `.env` files, wrap the value in double quotes and encode line breaks as `\n`. |
| `GITHUB_INSTALLATION_ID` | required (App auth) | Numeric ID from the App's installation page. |
| `GITHUB_STAGING_BRANCH` | optional | Defaults to `develop`. Where CMS PRs land first. |
| `GITHUB_PRODUCTION_BRANCH` | optional | Defaults to `master`. The promoted branch. |
| `GITHUB_PR_BASE_BRANCH` | optional | Defaults to `develop`. Target branch for new content PRs. |
| `GITHUB_CONTENT_BRANCH_PREFIX` | optional | Defaults to `content/`. Mutation primitives reject branches outside this prefix unless `CONTENT_DIRECT_COMMIT_ENABLED=true`. |
| `CONTENT_DIRECT_COMMIT_ENABLED` | optional | `true` allows commits to staging/production directly. Off by default — branch protection enforces this on the GitHub side too. |
| `NEXT_PUBLIC_SERVER_URL` | recommended | Public CMS URL for CORS + CSRF. Falls back to `https://$VERCEL_URL` (different per preview deploy). |
| `NEXT_PUBLIC_WEB_URL` | recommended | Public web URL for CORS + CSRF. Falls back to `http://localhost:3000` if unset — set explicitly on every non-local deploy. |

Set the required App-auth variables for both **Production** and **Preview** environments in the Vercel dashboard (Settings → Environment Variables). Preview deploys without `DATABASE_URL` will throw at build time.

### GitHub App setup for CMS pull requests

Use GitHub App authentication for every CMS environment, including local development. Personal access tokens are not supported because they make CMS-created GitHub actions appear to come from an individual account.

Create the App under the repository owner organization:

1. Open `https://github.com/organizations/acid-info/settings/apps/new`.
2. Enter a clear app name, for example `Logos CMS Content Bot`.
3. Set **Homepage URL** to `https://github.com/acid-info/logos-co`.
4. Leave **Callback URL** and **Setup URL** empty. The CMS does not use GitHub OAuth user authorization.
5. Turn **Webhook Active** off unless PR-status webhooks are being configured separately.
6. In **Repository permissions**, grant:
   - **Contents**: Read and write
   - **Pull requests**: Read and write
   - **Metadata**: Read-only (GitHub grants this automatically)
7. Leave all other permissions at **No access**.
8. Set the App visibility to **Only on this account**.
9. Click **Create GitHub App**.

Generate and store the private key:

1. In the new App's settings, find **Private keys**.
2. Click **Generate a private key**.
3. Store the downloaded `.pem` file in the team's secret manager.
4. Use the full PEM contents, including the `BEGIN` and `END` lines, as `GITHUB_APP_PRIVATE_KEY`.

For local `.env` files, keep the PEM on one quoted line and replace every real newline with `\n`:

```dotenv
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
```

Do not remove the `BEGIN` / `END` lines. In Vercel, paste the multiline PEM value directly instead; Vercel preserves the newlines.

Install the App on this repository:

1. In the App settings sidebar, click **Install App**.
2. Click **Install** next to `acid-info`.
3. Choose **Only select repositories**.
4. Select `logos-co`.
5. Review the requested permissions and click **Install**.

Find the installation ID:

1. Start from the App settings page, for example `https://github.com/organizations/acid-info/settings/apps/logos-cms`.
2. In the left sidebar, click **Install App**.
3. If the App is already installed on `acid-info`, click **Configure** next to `acid-info`. If it is not installed yet, complete the installation steps above first.
4. Confirm the browser URL has changed from `/settings/apps/<app-slug>` to `/settings/installations/<number>`.
5. Use that trailing number as `GITHUB_INSTALLATION_ID`. For example, in `https://github.com/organizations/acid-info/settings/installations/12345678`, the installation ID is `12345678`.

Record the environment values:

```text
GITHUB_OWNER=acid-info
GITHUB_REPO=logos-co
GITHUB_APP_ID=<App ID from the App settings General page>
GITHUB_APP_PRIVATE_KEY=<full PEM contents from the downloaded private key>
GITHUB_INSTALLATION_ID=<numeric ID from the installation settings URL>
```

After setting these variables, restart the CMS and create a test content PR. The PR author should be the GitHub App bot, not a personal account. Editor attribution stays in Payload's `ContentChangeRequest.createdBy` audit record instead of the public GitHub author field.

## 4. Database: Supabase Postgres

The repo currently runs against an existing Supabase Postgres (the same instance used by the `admin-acid` workspace). Payload's tables are isolated under the `payload` schema so the two apps coexist without interference.

### Connection details

- Connection string format: `postgresql://postgres.<project-ref>:<password>@aws-1-<region>.pooler.supabase.com:6543/postgres`.
- Port `6543` is Supabase's transaction-mode pooler — fine for Payload's read/write traffic. If you observe `prepared statement does not exist` errors at scale, switch to the session-mode pooler (port `5432` on the same hostname) by changing the port in `DATABASE_URL`.
- SSL is required by Supabase; the URL handles it implicitly via the pooler.

### Schema isolation

Set `PAYLOAD_DB_SCHEMA` per environment if you want Production and Preview to share a Postgres but not collide:

```text
Production : PAYLOAD_DB_SCHEMA=payload
Preview    : PAYLOAD_DB_SCHEMA=payload_preview
```

When omitted, both use `payload`. The first request after a deploy creates the schema and tables.

### Bootstrapping the schema (first-time only)

Payload's `push: true` config syncs schema changes via Drizzle's introspect/push mechanism, which runs **only** when the CMS is started in dev mode. On Vercel cold starts the runtime never executes a push, so a brand-new database boots into:

```text
relation "payload.users" does not exist
```

To create the `payload` schema and tables once, point a local `apps/cms` dev server at the remote database:

```bash
# In apps/cms/.env, set DATABASE_URL to the same value Vercel uses.
pnpm --filter cms dev
# Wait for "✓ Pulling schema from database..." then hit any admin URL once:
curl -sS -o /dev/null -w '%{http_code}\n' http://localhost:3001/admin
```

After the first request the `payload` schema appears in Postgres with all required tables (`users`, `users_sessions`, `pages`, `payload_preferences`, etc.). Subsequent prod deploys read those tables happily.

Repeat this step whenever a schema change ships (new collection, new field) until the project graduates to proper migrations (Phase 4+).

### First admin user

The CMS does not seed an initial admin. After the schema is bootstrapped:

1. Visit `https://logos-co-cms.vercel.app/admin`.
2. Payload's first-run flow prompts for an admin email + password.
3. The user is written to the Postgres `payload` schema and persists across deploys.

If preview deploys share the same `DATABASE_URL` and `PAYLOAD_DB_SCHEMA`, the same admin user works everywhere. Set a different `PAYLOAD_DB_SCHEMA` for preview to isolate users; the bootstrap step needs to run once per schema.

### Alternative: dedicated Postgres / Neon / Vercel Postgres

Any Postgres works — swap `DATABASE_URL` and the rest of this guide stays the same. The adapter (`@payloadcms/db-postgres`) does not change.

## 5. Local Development

```bash
cp apps/cms/.env.example apps/cms/.env
# edit apps/cms/.env: paste real DATABASE_URL + a dev PAYLOAD_SECRET
pnpm install
pnpm --filter cms dev          # → http://localhost:3001/admin
pnpm --filter web dev          # → http://localhost:3000
```

`apps/cms/.env` is gitignored. Do not paste real credentials into `apps/cms/.env.example` — it is committed.

If multiple developers share one Postgres instance, set `PAYLOAD_DB_SCHEMA=payload_yourname` in your local `.env` to keep your sandbox isolated.

## 6. Web App (apps/web) Deployment

`apps/web` is currently static-export friendly and does not need the CMS at request time. Production env on Vercel:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SERVER_URL` | optional | Used to render absolute URLs (sitemap, OG tags). Defaults to localhost in dev. |

Vercel's standard Next.js build works without further configuration. The `content/**` directory is part of the repo, so the build reads fixtures directly.

## 7. Deploy Pipeline Sanity Check

After setting env vars and redeploying:

```bash
curl -sS -o /dev/null -w '%{http_code}\n' https://logos-co-cms.vercel.app/api/pages
# Expected: 401  (unauthenticated request to a protected collection — Payload is up)
# Failure : 500  ("There was an error initializing Payload")
```

A 401 means Payload booted, talked to Postgres, and answered. A 500 means env vars are still wrong; check the Vercel deploy logs for the explicit error message — the new config prints actionable text instead of a generic stack.

## 8. Troubleshooting Checklist

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| `There was an error initializing Payload` (still) | `DATABASE_URL` not set on the right environment (Production vs Preview) | Set on both. Vercel keeps them separate. |
| `DATABASE_URL is required ...` | env var unset entirely | Set `DATABASE_URL` in Vercel (Settings → Environment Variables) for the active environment. |
| `PAYLOAD_SECRET environment variable is required in production` | secret unset | Add `PAYLOAD_SECRET` to Vercel env vars. |
| `password authentication failed for user "postgres"` | wrong / rotated DB password | Update `DATABASE_URL` with the current Supabase password. |
| `connection reset` / `ECONNRESET` mid-request | Supabase pooler timeout under heavy load | Switch port from `6543` (transaction) to `5432` (session) in `DATABASE_URL`. |
| `prepared statement "S_1" does not exist` | transaction pooler dropped a prepared statement | Same fix — use the session pooler at port `5432`. |
| `(EMAXCONNSESSION) max clients reached in session mode` | Too many Vercel serverless instances each opening a Postgres pool against a small Supabase session-pool limit | Set `PAYLOAD_DB_POOL_MAX=1` in Vercel, redeploy, and close stale Admin tabs. |
| `/api/health` times out until Vercel's 300s runtime limit | Payload or Postgres is hanging during initialization or the first DB read | Keep `PAYLOAD_DB_POOL_MAX=1`, set the DB timeout env vars above if needed, redeploy, then check `/api/health` for the exact timed-out step. |
| `relation "payload.users" does not exist` | tables not yet created in the target schema (Drizzle push only runs in dev mode) | Bootstrap by running `pnpm --filter cms dev` locally with `DATABASE_URL` set to the same value Vercel uses, hit `/admin` once, then redeploy prod. See "Bootstrapping the schema" above. |
| CORS errors from `apps/web` calling the CMS | `NEXT_PUBLIC_WEB_URL` mismatch | Set the env var to the exact web origin (no trailing slash). |
| Admin login redirects then fails | Cookie domain mismatch or stale session | Ensure `NEXT_PUBLIC_SERVER_URL` matches the URL the browser is using. Clear cookies. |
| Preview deploys mutate production data | Single schema across envs | Set `PAYLOAD_DB_SCHEMA=payload_preview` on the Preview env only. |

## 9. Self-Hosted Production

Production runs on **self-hosted Node** (no Vercel). The CMS app is a Next.js 16 + Payload v3 server; both build into a standalone Node bundle that has no Vercel runtime dependencies.

### 9.1 Build artefact

`apps/cms` produces a standalone server with `next build`. The standalone bundle is the only artefact you ship — no Vercel runtime, no edge functions.

```bash
pnpm install --frozen-lockfile
pnpm --filter cms build
# Produces apps/cms/.next/standalone/   (server.js + minimal node_modules)
# Plus  apps/cms/.next/static/          (static chunks served by your reverse proxy)
# Plus  apps/cms/public/                (favicons, etc.)
```

For a static-export production build of `apps/web` see plan §6 — it ships as a static site behind any HTTP server / CDN.

### 9.2 Required env vars (production)

Identical to the Vercel matrix in §3 except:

- `NEXT_PUBLIC_SERVER_URL` is **required** (the CMS now throws at boot when it is unset and `VERCEL` is not present).
- `NEXT_PUBLIC_WEB_URL` is **required** (same reason — needed for CORS / CSRF allow-list).
- `PAYLOAD_SECRET`, `DATABASE_URL` — same requirements as Vercel.
- `PAYLOAD_DB_SCHEMA` — recommended; pin to e.g. `payload` so a future env split is trivial.

Set `NODE_ENV=production` so Payload's prod guards are active and Next runs the prod codepath.

### 9.3 Reference Dockerfile (sketch)

```dockerfile
# 1. Install deps + build
FROM node:22-alpine AS build
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@10.9.0 --activate
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json turbo.json ./
COPY apps/cms ./apps/cms
COPY packages ./packages
COPY content ./content
RUN pnpm install --frozen-lockfile
RUN pnpm --filter cms build

# 2. Runtime image — only ship the standalone output
FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/apps/cms/.next/standalone ./
COPY --from=build /app/apps/cms/.next/static ./apps/cms/.next/static
COPY --from=build /app/apps/cms/public ./apps/cms/public
EXPOSE 3001
CMD ["node", "apps/cms/server.js"]
```

Build and run:

```bash
docker build -t logos-cms:latest -f Dockerfile .
docker run --rm -p 3001:3001 \
  -e NODE_ENV=production \
  -e PAYLOAD_SECRET="$(openssl rand -hex 32)" \
  -e DATABASE_URL="postgresql://..." \
  -e PAYLOAD_DB_SCHEMA=payload \
  -e NEXT_PUBLIC_SERVER_URL=https://cms.example.com \
  -e NEXT_PUBLIC_WEB_URL=https://example.com \
  logos-cms:latest
```

### 9.4 Reverse proxy + TLS

The Node server only speaks HTTP on `:3001`. Terminate TLS upstream (nginx, Caddy, Cloudflare, Traefik) and forward:

- `https://cms.example.com` → `http://logos-cms:3001`
- Forward standard headers: `Host`, `X-Forwarded-For`, `X-Forwarded-Proto`.
- WebSocket upgrade is not required for Payload v3 today, but is harmless to enable.

Make sure `NEXT_PUBLIC_SERVER_URL` matches the externally-reachable URL (with `https://`) — otherwise Payload's auth cookies bind to the wrong origin and admin login round-trips fail.

### 9.5 Process supervision

Pick one. All three keep the standalone server alive across crashes / reboots:

- **systemd unit** — simplest on a single VM. `Type=simple`, `Restart=on-failure`, `EnvironmentFile=/etc/logos-cms.env`.
- **Docker Compose** — `restart: unless-stopped` plus `healthcheck: curl -f http://localhost:3001/admin || exit 1`.
- **Kubernetes** — readiness probe on `/admin/login` (not `/api/pages` — that 403s). Use `RollingUpdate` so admin sessions survive deploys.

### 9.6 Database — migrations, not push

`push: true` is fine for dev-mode bootstrap (see §4 "Bootstrapping the schema") but **must be turned off in self-hosted production**. Production schema changes ship as numbered migration files reviewed alongside the schema PR.

Disable push in prod env:

```text
PAYLOAD_DB_PUSH=false
```

Generate + apply migrations (Phase 4+ workflow):

```bash
# Local: capture the schema diff once a release is ready
pnpm --filter cms exec payload migrate:create

# Production: apply pending migrations before the new build serves traffic
pnpm --filter cms exec payload migrate
```

Run `payload migrate` as a deploy hook (e.g. before rotating Docker containers or as a Kubernetes Job) — never let runtime traffic see a half-migrated schema. Migration files live under `apps/cms/migrations/` and are checked into the repo.

Until that pipeline lands (Phase 4+) the bootstrap shortcut from §4 still works; just make sure prod stays on `PAYLOAD_DB_PUSH=false` once the schema is stable to keep accidental drift out of production.

### 9.7 Per-PR previews without Vercel

Plan §1 requires per-PR preview URLs reviewers can open. Replace Vercel's per-PR auto-deploy with one of:

- **CI workflow that builds + pushes a preview container** keyed by PR number, and a wildcard ingress (`pr-<n>.preview.example.com`).
- **Argo Rollouts / Kustomize overlay** that spins an ephemeral namespace per PR.
- **Static `apps/web` previews on object storage** (S3 + CloudFront) for content-only PRs that do not need a live CMS.

Whatever route you pick, the Phase 4c PR Status Panel reads the preview URL from a configurable callback so the CMS is not coupled to a specific host.

### 9.8 Security headers (self-hosted)

`apps/web` ships as a static export (`output: 'export'` in `next.config.mjs`) — Next.js's `headers()` config has no effect on the emitted HTML. Headers must come from the upstream web server.

**nginx (recommended for self-host):**

```nginx
server {
  listen 443 ssl http2;
  server_name logos.co;
  root /var/www/logos-co/out;

  # Security headers
  add_header X-Frame-Options "DENY" always;
  add_header X-Content-Type-Options "nosniff" always;
  add_header Referrer-Policy "strict-origin-when-cross-origin" always;
  add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
  # Strict-Transport-Security: enable once HTTPS is confirmed across all subdomains.
  # add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

  location / {
    try_files $uri $uri/ $uri.html =404;
  }
}
```

**Caddy:**

```caddyfile
logos.co {
  root * /var/www/logos-co/out
  file_server
  header {
    X-Frame-Options "DENY"
    X-Content-Type-Options "nosniff"
    Referrer-Policy "strict-origin-when-cross-origin"
    Permissions-Policy "camera=(), microphone=(), geolocation=()"
    # Strict-Transport-Security "max-age=31536000; includeSubDomains"
  }
}
```

CSP is intentionally omitted from these snippets — Leaflet tiles, Hasura GraphQL, and the press API need an inventory of `connect-src`/`img-src` hosts before CSP can be enabled without breaking pages. Track it as a separate task.

## 10. What Is Not Yet Wired

Tracked in plan §11 phases:

- **GitHub App credentials:** The CMS PR workflow is implemented, but each deployed environment must provide the App credentials from section 3 before editors can save changes back to GitHub.
- **Phase 4b/c follow-ups:** Any remaining editor save-flow and PR status-panel hardening tracked in the plan.
- **Phase 6:** External media storage. Phase 1 stores media in `apps/web/public/cms/...` inside the repo.

These phases are deployment-relevant when they land; this guide will be updated then.
