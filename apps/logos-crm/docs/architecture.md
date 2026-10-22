# Logos CRM architecture

Current-state overview of `apps/logos-crm`. The code covered here is
[`src/server`](../src/server), [`src/contracts`](../src/contracts), [`src/app`](../src/app),
[`src/components`](../src/components), [`drizzle/`](../drizzle), and the Docker setup.

## What this app is

`logos-crm` is a Next.js 16 (App Router, React 19, TypeScript) application that serves an internal
CRM workspace at `http://localhost:3004` and stores its data in a dedicated PostgreSQL database. It
runs `next start` and reads the database through Route Handlers, so it is a server runtime app, not
a static export like `apps/web`.

Today it is a working vertical slice rather than the full product. It provides a dashboard, a
searchable case queue with a status pipeline, case detail with a next action, people and
organisation directories, contact methods, case-to-record relationships, and per-record activities
and tasks. It ships without authentication and with demo data seeded by `db:seed`.

## Stack

| Concern     | Choice                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| Framework   | Next.js 16 App Router, React 19, TypeScript                                                |
| Database    | PostgreSQL via Drizzle ORM (`node-postgres`)                                               |
| API         | Next.js Route Handlers under `/api/v1`                                                     |
| Validation  | Zod v3 schemas in `src/contracts/`                                                         |
| Client data | TanStack Query v5, TanStack Table v8                                                       |
| Forms       | React Hook Form with `@hookform/resolvers`                                                 |
| UI          | `@acid-info/logos-ui`, `@acid-info/logos-tokens`, Tailwind CSS v4, `react-aria-components` |
| i18n        | `next-intl`, single `en` locale                                                            |

## Request flow

```
Browser (TanStack Query)
  -> Next.js Route Handler (src/app/api)
  -> repository module (src/server)
  -> Drizzle (src/server/db)
  -> PostgreSQL
```

Client components fetch through [`src/lib/api-client.ts`](../src/lib/api-client.ts), a small helper
that parses JSON and maps the error envelope to a typed `ApiClientError`. Route handlers validate
input with the Zod contract, call a repository, and shape responses with
[`src/server/api-response.ts`](../src/server/api-response.ts). Repositories own the Drizzle queries
and transactions.

## Layers

- **Contracts** ([`src/contracts`](../src/contracts)): browser-safe Zod schemas plus the shared
  value lists in `values.ts` that both the contracts and the Drizzle enums consume.
- **Server** ([`src/server`](../src/server)): env parsing, the pg pool and Drizzle client, the
  schema, the seed, and three repository modules (cases, directory, work).
- **Pages** ([`src/app`](../src/app)): the App Router routes that render each screen.
- **Components** ([`src/components`](../src/components)): client UI, dialogs, and the data hooks.

## What exists

- Seven screens: dashboard, cases, case detail, people, person detail, organisations, organisation
  detail.
- REST endpoints for health, dashboard summary, cases, people, organisations, activities, and tasks.
- Nine PostgreSQL tables with enums, unique indexes, and one-subject `CHECK` constraints. See
  [data-model.md](data-model.md) for the full schema.
- Docker Compose with PostgreSQL, a one-shot migration and seed step, and the web service. See
  [deployment.md](deployment.md).

## Not implemented yet

The earlier specification proposed a larger v1. None of the following is built, and there is no
stub code for it:

- Authentication and authorisation: no identity proxy, users, roles, CASL, or permission checks.
  `cases.owner`, `tasks.assignee`, and `activities.created_by` are free text; the UI hardcodes demo
  names such as "Mara Chen".
- Graphile Worker jobs, email and Discord notifications, reminders, and SMTP.
- Imports, exports, CSV/XLSX generation, and CiviCRM cutover or reconciliation.
- Duplicate detection and merge for people and organisations.
- Audit trail and field-level change history.
- Reports beyond the dashboard counts, cross-team visibility, and settings screens.
- Global cross-entity search: search is per resource (`q` on cases, people, organisations).
- Pagination: list endpoints return all rows.
- Optimistic concurrency: the `version` column exists but no `If-Match` handling reads it.
- Playwright, Vitest, and integration test suites.
