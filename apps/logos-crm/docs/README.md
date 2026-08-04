# Logos CRM Specifications

Read in this order:

1. [`architecture.md`](architecture.md) — scope, decisions, packages, permissions, and acceptance criteria.
2. [`data-model.md`](data-model.md) — PostgreSQL entities, constraints, merge rules, visibility, search, and retention.
3. [`backend.md`](backend.md) — services, API routes, jobs, reporting, security, and tests.
4. [`frontend.md`](frontend.md) — screens, interactions, design-system requirements, and browser tests.
5. [`deployment.md`](deployment.md) — Docker Compose, Infra contracts, secrets, health, release, and recovery.
6. [`migration.md`](migration.md) — CiviCRM import, reconciliation, cutover, and rollback.

The runtime is intentionally small: one Next.js application image used by `web` and `worker`, one PostgreSQL service, one protected file volume, and Infra-provided authentication and SMTP. There is no Redis, hosted queue, Vercel dependency, separate backend service, or separate scheduler.

Implementation is reuse-first: Drizzle owns schema, `drizzle-zod` owns validation derivation, Drizzle Kit owns migrations, and Drizzle Seed owns fixtures; Next.js Route Handlers expose REST endpoints; Zod owns boundary validation; CASL owns ability evaluation; Graphile Worker owns scheduling and retries; PapaParse and ExcelJS own file formats. CRM-specific code is limited to business rules, queries, and UI composition.

## Demo implementation

The `logos-crm` branch includes a PostgreSQL-backed vertical slice under `apps/logos-crm`: a pipeline summary, searchable case table, case detail/next-action view, case creation, status progression, people and organisation directories, contact methods, and explicit case relationships through Next.js Route Handlers. It intentionally omits production authentication, CASL enforcement, Graphile Worker jobs, notifications, imports, merges, and CiviCRM cutover.

Run the complete demo with `docker compose -f apps/logos-crm/compose.yaml up --build`. Compose starts PostgreSQL, runs the Drizzle migration and idempotent demo seed, then serves the CRM at `http://localhost:3004`. The `db:migrate`, `db:seed`, and `dev` workspace scripts remain available for local development.
