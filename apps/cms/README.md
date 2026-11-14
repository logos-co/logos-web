# Logos CMS

The Payload CMS admin for logos.co, a Next.js 16 app on port 3001 with the admin UI at `/admin`.

Editors use it to change site content, but nothing they do writes to the live site directly. The "Create PR" action opens a GitHub PR against `develop` that edits files under `content/**`, and the public site builds from those files. Postgres holds users, sessions, drafts and the records used to track publishing. The rules for that workflow are in [AGENTS.md](AGENTS.md).

When two editors change different builder or circle resources, both edits are kept in the shared list PR. Bulk edits and deletions share that PR. If a resource edit fails to reach the PR, the CMS restores that item so you can retry, including a slug change. Successful items keep their changes.

If GitHub cannot confirm a rename, the CMS keeps the old and requested slugs in its private recovery table. The next edit or deletion checks the current Git file before applying changes. Until the rename is resolved, another record cannot claim either slug and the startup sync skips both names. If an edit and a deletion overlap on the same resource, the second request returns HTTP 409. Refresh the record before retrying.

## Run

```bash
cp apps/cms/.env.example apps/cms/.env   # fill in DATABASE_URL
pnpm dev:cms                             # http://localhost:3001/admin
```

`pnpm dev:cms` goes through turbo, so it builds the workspace packages the CMS depends on first. `pnpm --filter cms dev` skips that and starts `next dev` straight away. Both run against your own Postgres with schema auto-sync on, and the dev script refuses to start if it detects a production or Vercel environment.

## Environment

`DATABASE_URL` is the only variable you need to boot locally. `PAYLOAD_SECRET` is required everywhere; when it is unset, `pnpm dev` generates a random one per run (sessions reset on restart). Everything else, including the GitHub App credentials behind "Create PR", is in [docs/environment.md](docs/environment.md).

Set `CMS_TEST_DATABASE_URL` to a test PostgreSQL database when running `pnpm --filter cms test` to include the concurrent PR save test. The test creates and drops its own schema. CI supplies this database.

## Deploy

Production runs as a self-hosted Docker image that applies the reviewed SQL migrations before `next start`. See [docs/deployment.md](docs/deployment.md).

## More

- [docs/README.md](docs/README.md): index of the CMS docs
- [docs/publishing.md](docs/publishing.md): how the Build staging and Publish live buttons work
- [AGENTS.md](AGENTS.md): rules for agents working in this app
