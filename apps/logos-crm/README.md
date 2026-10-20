# logos-crm

The Logos CRM: a self-hosted coordination workspace for people, organisations, and cases. A Next.js
16 server app backed by its own PostgreSQL database, currently a working demo vertical slice served
at `http://localhost:3004`.

## Run

    docker compose -f apps/logos-crm/compose.yaml up --build   # http://localhost:3004

For local development without Docker, start PostgreSQL first, then:

    pnpm --filter logos-crm db:migrate
    pnpm --filter logos-crm db:seed
    pnpm --filter logos-crm dev           # http://localhost:3004

## Environment

Copy `.env.example` to `.env`. The only variable is `DATABASE_URL`, a PostgreSQL connection string.

## Deploy

The only supported target is Docker Compose on a Logos-controlled Linux host. See
[docs/deployment.md](docs/deployment.md).

## More

- [Docs](docs/README.md)
- [Agent guide](AGENTS.md)
