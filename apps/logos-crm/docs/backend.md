# Logos CRM backend

Current-state reference for the server side of `apps/logos-crm`: the contracts in
[`src/contracts`](../src/contracts), the database and repositories in [`src/server`](../src/server),
and the route handlers in [`src/app/api`](../src/app/api).

## Layout

| Path                                 | Role                                                                    |
| ------------------------------------ | ----------------------------------------------------------------------- |
| `src/contracts/`                     | Browser-safe Zod schemas and shared value lists                         |
| `src/server/env.ts`                  | Zod-validated server env (only `DATABASE_URL`)                          |
| `src/server/db/index.ts`             | `pg` pool and Drizzle client, cached on `globalThis` outside production |
| `src/server/db/schema.ts`            | Drizzle table and enum definitions                                      |
| `src/server/db/seed.ts`              | Idempotent demo seed                                                    |
| `src/server/case-repository.ts`      | Case queries, status updates, and dashboard summary                     |
| `src/server/directory-repository.ts` | People and organisation queries and mutations                           |
| `src/server/work-repository.ts`      | Activity and task queries and mutations                                 |
| `src/server/api-response.ts`         | Error envelope helpers                                                  |
| `src/app/api/`                       | Next.js Route Handlers                                                  |

## Contracts

Schemas live in [`src/contracts`](../src/contracts) and are shared between server and client without
importing server modules. Types are inferred with `z.infer`; there are no handwritten DTO interfaces.

- `values.ts`: the seven controlled value lists used by both contracts and Drizzle enums.
- `case.ts`: `createCaseSchema`, `updateCaseStatusSchema`, `caseListQuerySchema`, `caseRecordSchema`.
- `directory.ts`: create and update schemas for people and organisations, list queries, and record
  schemas.
- `work.ts`: `workListQuerySchema` plus create and update schemas for activities and tasks.

Requests are validated with `.parse` in the route handler; failures surface as `VALIDATION_ERROR`
through `apiException`.

## Repositories

- `case-repository.ts` lists and reads cases (joining link tables into `organisationId` and
  `relatedPeople`), creates a case in a transaction that also writes `crm_case_organisations` and
  `crm_case_people`, updates case status, and computes the dashboard summary grouped by status.
- `directory-repository.ts` lists organisations and people with contact and case counts, creates and
  updates both, and normalises values before storing them: `normaliseName` lowercases and collapses
  whitespace, and `normaliseContact` lowercases emails and strips non-digit characters from phones.
  Person email and phone are stored as `crm_contact_methods` rows, replaced transactionally on
  update.
- `work-repository.ts` lists and creates activities and tasks against exactly one subject (case,
  person, or organisation), and updates tasks, setting `completed_at` only when status becomes
  `completed`.

## API surface

All routes return JSON. List endpoints accept no pagination and return all rows.

| Method  | Path                        | Purpose                                         |
| ------- | --------------------------- | ----------------------------------------------- |
| `GET`   | `/api/health`               | Liveness probe, returns `{ status, service }`   |
| `GET`   | `/api/v1/dashboard`         | `{ total, openTotal, byStatus }` summary        |
| `GET`   | `/api/v1/cases`             | List cases, optional `q` and `status`           |
| `POST`  | `/api/v1/cases`             | Create a case (201)                             |
| `GET`   | `/api/v1/cases/:id`         | Case detail or 404                              |
| `PATCH` | `/api/v1/cases/:id`         | Update case status only                         |
| `GET`   | `/api/v1/organisations`     | List organisations, optional `q`                |
| `POST`  | `/api/v1/organisations`     | Create an organisation (201)                    |
| `GET`   | `/api/v1/organisations/:id` | Organisation detail or 404                      |
| `PATCH` | `/api/v1/organisations/:id` | Update an organisation                          |
| `GET`   | `/api/v1/people`            | List people, optional `q`                       |
| `POST`  | `/api/v1/people`            | Create a person (201)                           |
| `GET`   | `/api/v1/people/:id`        | Person detail or 404                            |
| `PATCH` | `/api/v1/people/:id`        | Update a person                                 |
| `GET`   | `/api/v1/activities`        | List activities for `subjectType` + `subjectId` |
| `POST`  | `/api/v1/activities`        | Record an activity (201)                        |
| `GET`   | `/api/v1/tasks`             | List tasks for `subjectType` + `subjectId`      |
| `POST`  | `/api/v1/tasks`             | Create a task (201)                             |
| `PATCH` | `/api/v1/tasks/:id`         | Update or complete a task                       |

Path identifiers are validated as UUIDs in the route before use. Successful mutations return the
created or updated record as `{ item }`; lists return `{ items }`.

## Error envelope

Errors from [`src/server/api-response.ts`](../src/server/api-response.ts) use one shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": { "title": "..." }
  }
}
```

`fields` is only present for validation errors. Codes in use: `VALIDATION_ERROR` (400),
`NOT_FOUND` (404), `DUPLICATE_RECORD` (409, Postgres unique violation `23505`),
`RELATED_RECORD_NOT_FOUND` (400, foreign-key violation `23503`), and `INTERNAL_ERROR` (500).

## Not present

There is no authentication or authorisation, no actor resolution, no jobs or notifications, no
imports or exports, and no audit log. Owner, assignee, and `created_by` are free text supplied by
the client, and the API trusts the request as-is.
