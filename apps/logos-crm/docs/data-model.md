# Logos CRM - Data Model

## 1. Modelling rules

- PostgreSQL is the only application datastore and queue backend.
- UUIDs are primary keys; public APIs expose the same stable IDs.
- Mutable rows use `created_at`, `updated_at`, and an integer `version` for optimistic concurrency.
- Business records are archived before any permanent deletion workflow.
- Controlled values use stable codes, not display labels.
- Personal data is not copied into audit or job payloads unless delivery requires it.
- Imported records retain source identifiers and migration provenance.

## 2. Identity and access

### `users`

| Column             | Notes                                          |
| ------------------ | ---------------------------------------------- |
| `id`               | UUID primary key                               |
| `external_subject` | Unique immutable subject supplied by Infra     |
| `email`            | Normalised current email; not the identity key |
| `username`         | Unique mention handle, case-insensitive        |
| `display_name`     | Human-readable name                            |
| `status`           | `pending`, `active`, or `suspended`            |
| `last_login_at`    | Last accepted authenticated request            |

### `user_roles`, `teams`, `user_teams`

Roles are fixed application codes: `admin`, `leadership`, `coordinator`, `operator`, and `viewer`. `user_roles` assigns those codes to users. `teams` stores a stable code, display name, and active flag. `user_teams` records membership and whether the membership is primary.

The first administrator is created by an idempotent CLI/bootstrap command using an existing `external_subject`; there is no default password or public bootstrap endpoint. A valid Infra-authenticated subject not yet known to the CRM creates or refreshes a `pending` user and receives `403 USER_PENDING_APPROVAL` until an administrator assigns a role and activates it.

## 3. People and organisations

### `people`

Stores name, preferred name, lifecycle status, owning team, free-form summary, archived state, and merge target. Names are searchable but are not unique.

### `contact_methods`

Stores one email, telephone number, URL, or messaging handle per row. It has nullable `person_id` and `organisation_id` foreign keys with a check requiring exactly one owner, plus normalised value, display value, label, preferred flag, verification state, and suppression state. Normalised email and telephone values are indexed for duplicate suggestions.

### `organisations`

Stores legal/display name, website, lifecycle status, owning team, summary, archived state, and merge target. A normalised name and optional domain support duplicate suggestions but do not automatically merge records.

People and organisations are visible when their owning team is in the user's scope or when they are linked to an accessible case. Records with no team and no accessible case are admin-only until assigned.

### `person_organisation_relationships`

Links a person to an organisation with a relationship type, title, start/end dates, primary flag, and notes. A database constraint prevents duplicate active relationships with the same person, organisation, and type.

### Merge rules

`entity_merges` records entity type, duplicate ID, survivor ID, actor, timestamp, and reason. A merge transaction:

1. moves contact methods, relationships, case links, activities, tasks, and external identities;
2. resolves unique conflicts explicitly;
3. archives the duplicate and records its survivor;
4. writes an audit event;
5. never silently discards a non-empty value.

Automatic matching only creates duplicate suggestions. A permitted user confirms every merge.

## 4. Cases and Ecodev fields

### `cases`

| Column          | Notes                                                           |
| --------------- | --------------------------------------------------------------- |
| `id`            | UUID primary key                                                |
| `case_type`     | Stable type code, initially `ecodev` plus imported legacy types |
| `title`         | Required display title                                          |
| `status_code`   | Current value from the case type's status catalogue             |
| `priority_code` | Controlled priority value                                       |
| `source_code`   | Controlled lead-source value                                    |
| `owner_user_id` | Nullable current owner                                          |
| `team_id`       | Nullable current team                                           |
| `opened_at`     | Business opening time                                           |
| `closed_at`     | Set only for terminal statuses                                  |
| `archived_at`   | Administrative archive time                                     |
| `version`       | Optimistic-concurrency token                                    |

`case_people` and `case_organisations` link cases to related records with a relationship role and primary flag.

### `ecodev_case_details`

One-to-one with an Ecodev case. It stores stage, substatus, business unit, platform codes, tags, summary notes, last-contact time, validation status, validation time, and validator user ID. Stage/substatus compatibility is validated against catalogue data.

### Workflow catalogues

`case_type_definitions`, `case_status_definitions`, `ecodev_stage_definitions`, and `ecodev_substatus_definitions` store stable codes, display order, active flag, `requires_attention` flag where applicable, reporting category, and effective date range. Reporting categories include `active_onboarding`, `approved`, `redirected`, `other_terminal`, and `none`. Catalogue rows can be superseded or deactivated but codes referenced by history cannot be deleted.

`catalogue_values` stores the simpler namespaced values for priority, source, business unit, platform, validation status, relationship type, and task priority. It uses stable code, label, order, active flag, and effective date range. Only administrators with `catalogues:manage` can change catalogues.

### History

`case_status_history` and `case_stage_history` store previous code, next code, effective time, actor, and optional reason. The initial value creates an initial history row. Open durations are calculated to the report's explicit `as_of` time.

`case_assignments` stores owner, team, `valid_from`, and `valid_to`. Exactly one current assignment may exist per case.

## 5. Activities, mentions, and tasks

### `activities`

An activity has a type (`note`, `call`, `meeting`, `email`, or `system`), plain-text body, visibility (`private`, `team`, or `shared`), actor, occurred time, and nullable case/person/organisation foreign keys with a check requiring exactly one parent. Case relationships provide any additional people or organisation context.

Private activities are visible only to the author and administrators. Team activities are visible to current members of the owning team. Shared activities follow normal record access. Changing visibility is audited.

### `activity_mentions`

Stores activity ID, mentioned user ID, and the username token captured at creation time. A unique constraint on activity and user prevents duplicate notifications. Mentions are rejected when the target user cannot access the activity.

### `tasks`

| Column             | Notes                                              |
| ------------------ | -------------------------------------------------- |
| `title`            | Required short action                              |
| `description`      | Optional details                                   |
| `status`           | `open`, `in_progress`, `completed`, or `cancelled` |
| `priority_code`    | Controlled priority                                |
| `assignee_user_id` | Required assignee                                  |
| `due_at`           | Nullable due time                                  |
| `completed_at`     | Required when completed                            |
| parent IDs         | Exactly one primary case, person, or organisation  |

Overdue means an incomplete task with `due_at` before the report/query `as_of` time. Reminder notifications are optional jobs derived from tasks; there is no separate scheduling service.

## 6. Jobs, notifications, imports, and exports

Graphile Worker owns queue state in PostgreSQL. Application tables do not duplicate the queue.

`notification_deliveries` stores recipient user, channel, activity/task link, deduplication key, state, attempts, last error code, and sent time. Email addresses and note bodies are resolved immediately before delivery rather than copied into long-lived job payloads.

`import_runs` stores source, file checksum, mode (`preview` or `commit`), status, counters, requester, and timestamps. `import_errors` stores row number, source ID, error code, and safe message. Raw imported files are deleted after the configured retention period.

`export_jobs` stores requester, resource, format, canonical filters, allowed column IDs, timezone, row count, state, protected file name, checksum, and expiry. The file name is generated by the server.

## 7. External identities and audit

`external_identities` links a source system and source ID to exactly one CRM entity. `(source_system, source_entity_type, source_id)` is unique. Merges move these links to the survivor without changing source IDs.

`audit_events` stores actor, action code, entity type/ID, request ID, timestamp, and a redacted field-level change summary. Secrets, full note bodies, contact values, and export contents are excluded. Audit rows are append-only at the application permission layer.

## 8. Search

Global search covers people, organisations, cases, and tasks using PostgreSQL `pg_trgm` and normalised indexed fields. Results are permission-filtered before pagination. Search returns a maximum of grouped results per entity type and never reveals the existence of inaccessible records.

## 9. Retention and deletion

- Export files and raw import files default to 24-hour retention.
- Notification delivery metadata defaults to 90-day retention; audit events retain only redacted delivery state.
- Application logs follow the Infra log-retention policy and exclude direct contact values and note bodies.
- Archiving hides a record from normal work but preserves it for authorised reporting and recovery.
- Approved personal-data deletion anonymises contact fields and note content that can legally be removed, preserves non-identifying aggregate/reporting facts, and writes a redacted audit event.
- Legal/business retention durations for CRM records and audit events must be approved before production; the values are configuration and policy, not hard-coded application constants.
