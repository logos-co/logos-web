# Logos CMS

Payload CMS admin app on Next.js 16, backed by Postgres. The admin UI lives at `/admin` and the app runs on port 3001.

Postgres is not the production source of truth for content. It stores users, sessions, drafts and PR cache; published content changes ship as GitHub PRs targeting `develop`. See [AGENTS.md](AGENTS.md) for the content workflow rules.

## Run

```bash
cp apps/cms/.env.example apps/cms/.env   # fill in PAYLOAD_SECRET and DATABASE_URL
pnpm dev:cms                             # http://localhost:3001/admin
```

`pnpm dev:cms` is a turbo wrapper that builds workspace dependencies first. `pnpm --filter cms dev` starts `next dev` directly against your own Postgres with schema auto-sync enabled. The dev wrapper refuses to run in deployment environments.

## Environment

Every variable is documented in [docs/environment.md](docs/environment.md). The only values required to boot are `PAYLOAD_SECRET` and `DATABASE_URL`.

## Deploy

Production is a self-hosted Docker image that applies reviewed SQL migrations before `next start`. See [docs/deployment.md](docs/deployment.md).

## More

- [docs/README.md](docs/README.md): index of CMS docs
- [docs/environment.md](docs/environment.md): environment variable reference
- [docs/deployment.md](docs/deployment.md): Docker, migrations, first admin, health check
- [docs/publishing.md](docs/publishing.md): article and site publishing
- [AGENTS.md](AGENTS.md): rules for agents working in this app
