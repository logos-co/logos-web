# Logos CRM Specifications

Read in this order:

1. [`architecture.md`](architecture.md) - scope, decisions, packages, permissions, and acceptance criteria.
2. [`data-model.md`](data-model.md) - PostgreSQL entities, constraints, merge rules, visibility, search, and retention.
3. [`backend.md`](backend.md) - services, API routes, jobs, reporting, security, and tests.
4. [`frontend.md`](frontend.md) - screens, interactions, design-system requirements, and browser tests.
5. [`deployment.md`](deployment.md) - Docker Compose, Infra contracts, secrets, health, release, and recovery.
6. [`migration.md`](migration.md) - CiviCRM dump import, the Notion bridge period, intake cutover, and rollback.
7. [`civicrm-export-checklist.md`](civicrm-export-checklist.md) - what to export from CiviCRM before the instances are switched off.
8. [`open-questions.md`](open-questions.md) - decisions the implementation deferred, what it assumed instead, and what each costs if it arrives late.
9. [`logos-scout.md`](logos-scout.md) - organisation-first discovery: the review workflow that is built, the evidence and assessment rules behind it, and what must be decided before a real source is enabled.

The runtime is intentionally small: one Next.js application image used by `web` and `worker`, one PostgreSQL service, one protected file volume, and Infra-provided authentication and SMTP. There is no Redis, hosted queue, Vercel dependency, separate backend service, or separate scheduler.

Implementation is reuse-first: Drizzle owns the persistence schema, browser-safe Zod schemas own API and form contracts, Drizzle Kit owns migrations, and Drizzle Seed owns fixtures; Next.js Route Handlers expose REST endpoints; CASL owns ability evaluation; Graphile Worker owns scheduling and retries; PapaParse and `write-excel-file` own file formats. CRM-specific code is limited to business rules, queries, and UI composition.

## Current implementation

`apps/logos-crm` holds a PostgreSQL-backed vertical slice: a pipeline summary, searchable case table, case detail/next-action view, case creation, status progression, people and organisation directories, contact methods, explicit case relationships, record activity timelines, and assigned tasks through Next.js Route Handlers. Activities and tasks each belong to exactly one case, person, or organisation, with that invariant enforced in PostgreSQL. It supports recording notes, creating tasks, and completing or reopening tasks. It does not yet have production authentication, CASL enforcement, Graphile Worker jobs, reminders, notifications, imports, merges, or the intake cutover.

Logos Scout is part of the same application. It holds synthetic organisation
candidates with field-level public evidence and a deterministic assessment, so
a reviewer can accept, watch, reject, or ask for more evidence. It has no
source adapters, makes no external calls, and has no write path into the CRM:
accepting a candidate records a decision and creates nothing. See
[`logos-scout.md`](logos-scout.md).

Authentication is deliberately deferred: the Infra-managed identity contract is not settled yet, so the app runs without a login screen behind a single server-side actor seam. That is not the same as running without access control - an instance holding real personal data must sit behind Infra or VPN access control until the seam is wired to real identities, and the app refuses to start in production while the seam is in its no-auth mode.

Run the complete demo with `docker compose -f apps/logos-crm/compose.yaml up --build`. Compose starts PostgreSQL, runs the Drizzle migration and idempotent demo seed, then serves the CRM at `http://localhost:3004`. The `db:migrate`, `db:seed`, and `dev` workspace scripts remain available for local development.

## Tests

`pnpm --filter logos-crm test` runs the unit tests and needs nothing else.

Integration tests run against a real PostgreSQL instance, because the behaviour
they cover - transaction boundaries, partial unique indexes, check constraints -
does not exist in a mocked database. They truncate every CRM table, so the
target is named by its own variable and never falls back to `DATABASE_URL`:

```sh
docker compose -f apps/logos-crm/compose.yaml up -d crm-db
TEST_DATABASE_URL=postgresql://logos:logos@localhost:5434/logos_crm \
  pnpm --filter logos-crm test:integration
```

Re-run `db:seed` afterwards to restore the demo data.

Browser tests cover the coordinator flows end to end - intake capture, triage,
and evaluation through to a decision. They start their own dev server and need
the same database:

```sh
TEST_DATABASE_URL=postgresql://logos:logos@localhost:5434/logos_crm \
  pnpm --filter logos-crm test:e2e
```

They are deliberately outside `pnpm test`: they need a database and a build, and
a default suite that cannot run without setup is one people learn to skip.

## Migration baseline

The Drizzle migrations were squashed to a single baseline when the schema gained
users, temporal assignments, workflow history, audit events, and external
identities. No deployed instance existed, so replaying the old incremental
migrations had no value. An existing local database predating that change has to
be dropped and recreated rather than migrated:

```sh
docker compose -f apps/logos-crm/compose.yaml down -v
```
