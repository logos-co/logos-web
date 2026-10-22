# logos-crm

The Logos CRM, a self-hosted workspace for tracking people, organisations and cases. It is a
Next.js 16 server app with its own PostgreSQL database, and today it is a working demo: there is no
login, and it runs on `http://localhost:3004`.

## Run

The quickest way is Docker Compose, which starts PostgreSQL, applies migrations, loads the demo
seed and serves the app on port 3004:

    docker compose -f apps/logos-crm/compose.yaml up --build

To run the app outside Docker you still need PostgreSQL. `.env.example` points at the Compose
database on `localhost:5434`, so `docker compose -f apps/logos-crm/compose.yaml up crm-db` is
enough. Then, from the repo root:

    pnpm --filter logos-crm db:migrate
    pnpm --filter logos-crm db:seed
    pnpm dev:logos-crm                    # http://localhost:3004

The seed runs under `tsx`, which doesn't read `.env`, so export `DATABASE_URL` in your shell before
running `db:seed`.

## Environment

Copy `.env.example` to `.env`. The only variable is `DATABASE_URL`, a PostgreSQL connection string.

## Deploy

Docker Compose is the only setup in the repo, and it is for local or demo use: the app has no
authentication and `compose.yaml` hard-codes the database credentials. See
[docs/deployment.md](docs/deployment.md).

## More

- [Docs](docs/README.md)
- [Agent guide](AGENTS.md)
