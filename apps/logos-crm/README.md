# logos-crm

The Logos CRM, a self-hosted workspace for tracking people, organisations and cases. It is a
Next.js 16 server app with its own PostgreSQL database, and today it is a working demo: access is
one shared token, and it runs on `http://localhost:3004`.

## Run

The quickest way is Docker Compose, which starts PostgreSQL, applies migrations, loads the demo
seed and serves the app on port 3004. Compose refuses to start without `CRM_AUTH_TOKEN`:

    CRM_AUTH_TOKEN=$(openssl rand -hex 32) docker compose -f apps/logos-crm/compose.yaml up --build

To run the app outside Docker you still need PostgreSQL. `.env.example` points at the Compose
database on `localhost:5434`, so starting only `crm-db` is enough (Compose still needs the token
set):

    CRM_AUTH_TOKEN=$(openssl rand -hex 32) docker compose -f apps/logos-crm/compose.yaml up crm-db

Then, from the repo root:

    pnpm --filter logos-crm db:migrate
    pnpm --filter logos-crm db:seed
    pnpm dev:logos-crm                    # http://localhost:3004

The seed runs under `tsx`, which doesn't read `.env`, so export `DATABASE_URL` in your shell before
running `db:seed`.

## Environment

Copy `.env.example` to `.env`. `DATABASE_URL` is a PostgreSQL connection string. `CRM_AUTH_TOKEN`
is the shared access token: `pnpm dev:logos-crm` works without it, but `next start` and Docker
answer 401 to everything until it is set. Send it as `Authorization: Bearer <token>`, or enter it as
the password in the browser prompt (any user name).

## Deploy

Docker Compose is the only setup in the repo, and it is for local or demo use: the app has only a
shared token and `compose.yaml` hard-codes the database credentials. See
[docs/deployment.md](docs/deployment.md).

## More

- [Docs](docs/README.md)
- [Agent guide](AGENTS.md)
