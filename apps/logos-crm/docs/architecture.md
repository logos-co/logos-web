# Logos CRM architecture

How `apps/logos-crm` fits together today and what it doesn't do yet. It covers
[`src/server`](../src/server), [`src/contracts`](../src/contracts), [`src/app`](../src/app),
[`src/components`](../src/components), [`drizzle/`](../drizzle) and the Docker setup.

## What the app is

`logos-crm` is a Next.js 16 App Router app (React 19, TypeScript) that serves an internal CRM at
`http://localhost:3004` and keeps its data in a dedicated PostgreSQL database. Unlike `apps/web` it
is not a static export: it runs `next start` and reads the database from Route Handlers.

It is a vertical slice of the product. You get a dashboard, a searchable case queue with a status
pipeline, case detail with a next action, people and organisation directories with contact methods,
links between cases and directory records, and activities and tasks on each record. There is no
authentication, and `db:seed` loads demo data.

## Stack

| Concern     | Choice                                                                                     |
| ----------- | ------------------------------------------------------------------------------------------ |
| Framework   | Next.js 16 App Router, React 19, TypeScript                                                |
| Database    | PostgreSQL via Drizzle ORM (`node-postgres`)                                               |
| API         | Next.js Route Handlers under `/api/v1`                                                     |
| Validation  | Zod schemas in `src/contracts/`, imported from `zod/v4` (`zod` package 3.25)               |
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

Client components call the API through [`src/lib/api-client.ts`](../src/lib/api-client.ts), which
parses the JSON and throws a typed `ApiClientError` when the response carries the error envelope.
Route handlers validate input with the Zod contract, call a repository and build responses with
[`src/server/api-response.ts`](../src/server/api-response.ts). The repositories own every Drizzle
query and transaction.

## Code layout

[`src/contracts`](../src/contracts) holds the browser-safe Zod schemas, plus `values.ts` with the
controlled value lists that both the contracts and the Drizzle enums use.
[`src/server`](../src/server) has env parsing, the `pg` pool and Drizzle client, the schema, the
seed and three repository modules (cases, directory, work). The App Router routes in
[`src/app`](../src/app) render each screen from the client components, dialogs and data hooks in
[`src/components`](../src/components).

## What exists

- Seven screens: dashboard, cases, case detail, people, person detail, organisations and
  organisation detail. See [frontend.md](frontend.md).
- REST endpoints for health, the dashboard summary, cases, people, organisations, activities and
  tasks. See [backend.md](backend.md).
- Nine PostgreSQL tables with enums, unique indexes and one-subject `CHECK` constraints. See
  [data-model.md](data-model.md).
- Docker Compose with PostgreSQL, a one-shot migrate and seed step, and the web service. See
  [deployment.md](deployment.md).

## Not implemented yet

An earlier specification proposed a larger v1. None of the following exists, not even as stubs:

- Authentication and authorisation: no identity proxy, users, roles, CASL or permission checks.
  `cases.owner`, `tasks.assignee` and `activities.created_by` are free text, and the UI hardcodes
  demo names such as "Mara Chen".
- Graphile Worker jobs, email and Discord notifications, reminders and SMTP.
- Imports, exports, CSV/XLSX generation, and CiviCRM cutover or reconciliation.
- Duplicate detection and merging for people and organisations.
- An audit trail or field-level change history.
- Reports beyond the dashboard counts, cross-team visibility and settings screens.
- Global search across record types. Each list has its own `q` filter (cases, people,
  organisations).
- Pagination. List endpoints return every row.
- Optimistic concurrency. The `version` column exists, but nothing handles `If-Match` or reads it.
- Tests. There are no Playwright, Vitest or integration suites.
