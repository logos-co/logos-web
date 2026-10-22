# Logos CRM backend

Reference for the server side of `apps/logos-crm`: the contracts in
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
| `src/server/case-repository.ts`      | Case queries, status updates and the dashboard summary                  |
| `src/server/directory-repository.ts` | People and organisation queries and mutations                           |
| `src/server/work-repository.ts`      | Activity and task queries and mutations                                 |
| `src/server/api-response.ts`         | Error envelope helpers                                                  |
| `src/app/api/`                       | Next.js Route Handlers                                                  |

## Contracts

The schemas in [`src/contracts`](../src/contracts) are shared by server and client, so they never
import server modules. Types come from `z.infer`; there are no handwritten DTO interfaces.

- `values.ts`: the seven controlled value lists used by the contracts and the Drizzle enums.
- `case.ts`: `createCaseSchema`, `updateCaseStatusSchema`, `caseListQuerySchema`, `caseRecordSchema`.
- `directory.ts`: create and update schemas for people and organisations, the list query and the
  record schemas.
- `work.ts`: `workListQuerySchema` plus the create and update schemas for activities and tasks.

Route handlers call `.parse` on the input. A failure throws a `ZodError`, which `apiException`
turns into a `VALIDATION_ERROR` response.

## Repositories

`case-repository.ts` lists and reads cases, joining the link tables to fill in `organisationId` and
`relatedPeople`. It creates a case in one transaction together with its `crm_case_organisations` and
`crm_case_people` rows, updates case status, and builds the dashboard summary by counting cases per
status.

`directory-repository.ts` lists organisations (with contact and case counts) and people (with case
counts), and creates and updates both. It normalises values before storing them: `normaliseName` lowercases and
collapses whitespace, and `normaliseContact` lowercases emails and strips everything except digits
and `+` from phone numbers. A person's email and phone are `crm_contact_methods` rows; an update
that includes either field deletes the old row and inserts the new one in the same transaction.

`work-repository.ts` lists and creates activities and tasks for exactly one subject (case, person or
organisation) and updates tasks. Any status change rewrites `completed_at`: it is set to now when
the status becomes `completed` and cleared otherwise.

## API surface

Every route returns JSON. There is no pagination; lists return all rows.

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

Routes check that `:id` is a UUID before using it. Single records come back as `{ item }` and lists
as `{ items }`.

## Error envelope

Every error from [`src/server/api-response.ts`](../src/server/api-response.ts) has this shape:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "fields": { "title": "..." }
  }
}
```

Only validation errors include `fields`. The codes in use are:

| Code                       | Status | Cause                                        |
| -------------------------- | ------ | -------------------------------------------- |
| `VALIDATION_ERROR`         | 400    | `ZodError` from a contract or the UUID check |
| `NOT_FOUND`                | 404    | No record with that id                       |
| `DUPLICATE_RECORD`         | 409    | Postgres unique violation `23505`            |
| `RELATED_RECORD_NOT_FOUND` | 400    | Postgres foreign-key violation `23503`       |
| `INTERNAL_ERROR`           | 500    | Anything else                                |

## Not present

There is no authentication or authorisation, no actor resolution, no jobs or notifications, no
imports or exports, and no audit log. The client sends owner, assignee and `created_by` as free
text, and the API trusts them.
