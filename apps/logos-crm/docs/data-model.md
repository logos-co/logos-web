# Logos CRM data model

The PostgreSQL schema for `apps/logos-crm`. Tables and enums are defined in
[`src/server/db/schema.ts`](../src/server/db/schema.ts), and `db:generate` turns that file into the
SQL migrations in [`drizzle/`](../drizzle). Change the schema file, never the SQL.

## Conventions

Primary keys are UUIDs from Postgres `gen_random_uuid()`, and timestamps are
`timestamp with time zone` defaulting to `now()`. People and organisations also carry `created_at`,
`updated_at` and an integer `version`. Enum values come from
[`src/contracts/values.ts`](../src/contracts/values.ts), so the API contracts and the database
accept the same values. Every foreign key uses `ON DELETE CASCADE`: deleting a case, person or
organisation also deletes its contact methods, links, activities and tasks.

## Enums

| Enum                  | Values                                                |
| --------------------- | ----------------------------------------------------- |
| `case_status`         | `new`, `in_progress`, `waiting`, `resolved`, `closed` |
| `case_priority`       | `low`, `medium`, `high`                               |
| `directory_status`    | `prospect`, `active`, `inactive`                      |
| `contact_method_type` | `email`, `phone`, `url`, `messaging`                  |
| `activity_type`       | `note`, `call`, `email`, `meeting`                    |
| `task_status`         | `open`, `completed`, `cancelled`                      |
| `task_priority`       | `low`, `medium`, `high`                               |

## Tables

### `crm_organisations`

| Column            | Type             | Constraints                              |
| ----------------- | ---------------- | ---------------------------------------- |
| `id`              | uuid             | primary key, default `gen_random_uuid()` |
| `display_name`    | text             | not null                                 |
| `normalised_name` | text             | not null, unique                         |
| `domain`          | text             | nullable, indexed                        |
| `website`         | text             | nullable                                 |
| `status`          | directory_status | not null, default `prospect`, indexed    |
| `summary`         | text             | nullable                                 |
| `source_system`   | text             | nullable                                 |
| `external_id`     | text             | nullable                                 |
| `version`         | integer          | not null, default 1                      |
| `created_at`      | timestamptz      | not null, default `now()`                |
| `updated_at`      | timestamptz      | not null, default `now()`                |

Indexes: unique on `normalised_name`; unique on `(source_system, external_id)`; plain on `status`
and `domain`.

### `crm_people`

| Column           | Type             | Constraints                              |
| ---------------- | ---------------- | ---------------------------------------- |
| `id`             | uuid             | primary key, default `gen_random_uuid()` |
| `full_name`      | text             | not null, indexed                        |
| `preferred_name` | text             | nullable                                 |
| `role_title`     | text             | nullable                                 |
| `status`         | directory_status | not null, default `prospect`, indexed    |
| `summary`        | text             | nullable                                 |
| `source_system`  | text             | nullable                                 |
| `external_id`    | text             | nullable                                 |
| `version`        | integer          | not null, default 1                      |
| `created_at`     | timestamptz      | not null, default `now()`                |
| `updated_at`     | timestamptz      | not null, default `now()`                |

Indexes: plain on `full_name` and `status`; unique on `(source_system, external_id)`.

### `crm_cases`

| Column            | Type          | Constraints                                |
| ----------------- | ------------- | ------------------------------------------ |
| `id`              | uuid          | primary key, default `gen_random_uuid()`   |
| `title`           | text          | not null                                   |
| `organisation`    | text          | not null (denormalised display name)       |
| `owner`           | text          | not null (denormalised free text), indexed |
| `status`          | case_status   | not null, default `new`, indexed           |
| `stage`           | text          | not null                                   |
| `priority`        | case_priority | not null, default `medium`                 |
| `next_action`     | text          | not null                                   |
| `next_action_at`  | timestamptz   | not null                                   |
| `last_contact_at` | timestamptz   | nullable                                   |
| `created_at`      | timestamptz   | not null, default `now()`                  |
| `updated_at`      | timestamptz   | not null, default `now()`, indexed         |

Indexes: plain on `status`, `owner` and `updated_at`. `organisation` and `owner` are plain text for
display; the real links to directory records are in `crm_case_organisations` and `crm_case_people`.

### `crm_contact_methods`

| Column             | Type                | Constraints                                     |
| ------------------ | ------------------- | ----------------------------------------------- |
| `id`               | uuid                | primary key, default `gen_random_uuid()`        |
| `person_id`        | uuid                | nullable, FK to `crm_people.id`, cascade        |
| `organisation_id`  | uuid                | nullable, FK to `crm_organisations.id`, cascade |
| `type`             | contact_method_type | not null                                        |
| `display_value`    | text                | not null                                        |
| `normalised_value` | text                | not null, indexed                               |
| `label`            | text                | nullable                                        |
| `is_preferred`     | boolean             | not null, default false                         |
| `is_suppressed`    | boolean             | not null, default false                         |
| `created_at`       | timestamptz         | not null, default `now()`                       |

A `CHECK` requires exactly one owner: `num_nonnulls(person_id, organisation_id) = 1`. Indexes on
`person_id`, `organisation_id` and `normalised_value`.

### `crm_person_organisation_relationships`

| Column              | Type        | Constraints                                              |
| ------------------- | ----------- | -------------------------------------------------------- |
| `id`                | uuid        | primary key, default `gen_random_uuid()`                 |
| `person_id`         | uuid        | not null, FK to `crm_people.id`, cascade                 |
| `organisation_id`   | uuid        | not null, FK to `crm_organisations.id`, cascade, indexed |
| `relationship_type` | text        | not null, default `member`                               |
| `title`             | text        | nullable                                                 |
| `is_primary`        | boolean     | not null, default false                                  |
| `created_at`        | timestamptz | not null, default `now()`                                |

Unique index on `(person_id, organisation_id, relationship_type)`.

### `crm_case_people`

| Column              | Type    | Constraints                                       |
| ------------------- | ------- | ------------------------------------------------- |
| `id`                | uuid    | primary key, default `gen_random_uuid()`          |
| `case_id`           | uuid    | not null, FK to `crm_cases.id`, cascade           |
| `person_id`         | uuid    | not null, FK to `crm_people.id`, cascade, indexed |
| `relationship_role` | text    | not null, default `contact`                       |
| `is_primary`        | boolean | not null, default false                           |

Unique index on `(case_id, person_id)`.

### `crm_case_organisations`

| Column              | Type    | Constraints                                              |
| ------------------- | ------- | -------------------------------------------------------- |
| `id`                | uuid    | primary key, default `gen_random_uuid()`                 |
| `case_id`           | uuid    | not null, FK to `crm_cases.id`, cascade                  |
| `organisation_id`   | uuid    | not null, FK to `crm_organisations.id`, cascade, indexed |
| `relationship_role` | text    | not null, default `participant`                          |
| `is_primary`        | boolean | not null, default false                                  |

Unique index on `(case_id, organisation_id)`.

### `crm_activities`

| Column            | Type          | Constraints                                     |
| ----------------- | ------------- | ----------------------------------------------- |
| `id`              | uuid          | primary key, default `gen_random_uuid()`        |
| `case_id`         | uuid          | nullable, FK to `crm_cases.id`, cascade         |
| `person_id`       | uuid          | nullable, FK to `crm_people.id`, cascade        |
| `organisation_id` | uuid          | nullable, FK to `crm_organisations.id`, cascade |
| `type`            | activity_type | not null, default `note`                        |
| `body`            | text          | not null                                        |
| `occurred_at`     | timestamptz   | not null, default `now()`                       |
| `created_by`      | text          | not null (free text)                            |
| `created_at`      | timestamptz   | not null, default `now()`                       |

A `CHECK` requires exactly one subject: `num_nonnulls(case_id, person_id, organisation_id) = 1`.
Indexes on `(case_id, occurred_at)`, `(person_id, occurred_at)` and
`(organisation_id, occurred_at)`.

### `crm_tasks`

| Column            | Type          | Constraints                                     |
| ----------------- | ------------- | ----------------------------------------------- |
| `id`              | uuid          | primary key, default `gen_random_uuid()`        |
| `case_id`         | uuid          | nullable, FK to `crm_cases.id`, cascade         |
| `person_id`       | uuid          | nullable, FK to `crm_people.id`, cascade        |
| `organisation_id` | uuid          | nullable, FK to `crm_organisations.id`, cascade |
| `title`           | text          | not null                                        |
| `description`     | text          | nullable                                        |
| `status`          | task_status   | not null, default `open`                        |
| `priority`        | task_priority | not null, default `medium`                      |
| `assignee`        | text          | not null (free text)                            |
| `due_at`          | timestamptz   | not null                                        |
| `completed_at`    | timestamptz   | nullable, set when status becomes `completed`   |
| `created_at`      | timestamptz   | not null, default `now()`                       |
| `updated_at`      | timestamptz   | not null, default `now()`                       |

A `CHECK` requires exactly one subject: `num_nonnulls(case_id, person_id, organisation_id) = 1`.
Indexes on `(case_id, status, due_at)`, `(person_id, status, due_at)` and
`(organisation_id, status, due_at)`.

## Migrations

Three generated migrations build the schema in order:

1. `0000_jazzy_sinister_six.sql`: `crm_cases` and its two enums.
2. `0001_redundant_ben_parker.sql`: people, organisations, contact methods and the link tables.
3. `0002_old_captain_universe.sql`: activities and tasks.

To change the schema, see the migration commands in [deployment.md](deployment.md#migrations).
