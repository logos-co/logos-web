# CiviCRM API v4 -- Usage Guide

> Applies to: `apps/civi-crm`
> CiviCRM version: 5.x (APIv4)
> All CiviCRM HTTP calls go through `src/lib/civicrm/client.ts`. Never call CiviCRM directly from route handlers or components.

---

## Contents

1. [API fundamentals](#1-api-fundamentals)
2. [The client wrapper](#2-the-client-wrapper)
3. [Query building reference](#3-query-building-reference)
4. [Entity inventory](#4-entity-inventory)
5. [Instance-specific IDs](#5-instance-specific-ids)
6. [Query patterns and anti-patterns](#6-query-patterns-and-anti-patterns)
7. [Adding a new query -- checklist](#7-adding-a-new-query----checklist)

---

## 1. API fundamentals

### Endpoint

Every action targets:

```
{CIVICRM_BASE_URL}/civicrm/ajax/api4/{Entity}/{Action}
```

Examples:

```
GET /civicrm/ajax/api4/Case/get?params=...
POST /civicrm/ajax/api4/Activity/create?params=...
POST /civicrm/ajax/api4/Relationship/delete?params=...
```

### Authentication

The `X-Civi-Auth: Bearer <key>` header must be present on every request. This requires the **AuthX** extension to be enabled on the CiviCRM instance. Without it, the header is ignored and requests fail with 401.

```
X-Civi-Auth: Bearer <CIVICRM_API_KEY>
X-Requested-With: XMLHttpRequest
```

### Query params

All actions in this app pass APIv4 options via a URL-encoded JSON payload in the `params` query string key.
No action sends a JSON request body (`Content-Type: application/json` is not used by this app's CiviCRM client).

```text
/civicrm/ajax/api4/Case/get?params=%7B%22where%22%3A%5B%5B%22case_type_id%3Aname%22%2C%22%3D%22%2C%22movement_view%22%5D%5D%7D
```

Decoded `params` value:

```json
{
  "where": [["case_type_id:name", "=", "movement_view"]]
}
```

The decoded `params` object varies by action, for example:

```json
{
  "values": { "subject": "New case" }
}
```

### Response format

```json
{
  "values": [ { "id": 1, "subject": "..." }, ... ],
  "count": 2
}
```

| Key | Type | Meaning |
|---|---|---|
| `values` | `T[]` | Records returned by the action |
| `count` | `number` | Number of records in `values` (i.e. records fetched, not total matching -- see [counting](#counting-records)) |

On error, CiviCRM returns a non-2xx status with a plain-text or JSON body. The client wrapper surfaces this as a `CiviCRMError`.

### Actions used

| Action | `params` fields | Returns |
|---|---|---|
| `get` | `select`, `where`, `orderBy`, `limit`, `offset` | Matching records |
| `create` | `values` | The created record |
| `update` | `where`, `values` | Updated records |
| `delete` | `where` | Empty |

---

## 2. The client wrapper

**File:** `src/lib/civicrm/client.ts`

```typescript
class CiviCRMClient {
  get<T>(entity: string, params: CiviParams): Promise<T[]>
  create<T>(entity: string, values: Record<string, unknown>): Promise<T>
  update<T>(entity: string, where: CiviWhere[], values: Record<string, unknown>): Promise<T[]>
  delete(entity: string, where: CiviWhere[]): Promise<void>
  count(entity: string, params: Pick<CiviParams, 'where'>): Promise<number>
}
```

All outbound requests go through this class. It:
- Injects the `X-Civi-Auth` and `X-Requested-With` headers automatically.
- Throws `CiviCRMError(status, message)` on any non-2xx response.
- Unwraps `data.values` so callers receive plain arrays.

`count()` uses the `row_count` aggregate field (see [Counting records](#counting-records)). Never implement counting by hand in caller code.

### `CiviParams` type

```typescript
type CiviWhereValue = boolean | number | string | null

type CiviWhere = [string, string, CiviWhereValue | CiviWhereValue[]]

type CiviParams = {
  select?: string[]
  where?: CiviWhere[]
  orderBy?: Record<string, 'ASC' | 'DESC'>
  values?: Record<string, unknown>
  limit?: number
  offset?: number
}
```

---

## 3. Query building reference

### `select`

An array of field paths to return. Omitting `select` returns all fields, which is wasteful -- always specify what you need.

```typescript
select: ['id', 'subject', 'status_id:label', 'Circle_Case.Lead_Source:name']
```

**Option-list fields** (dropdowns, selects) have two useful variants:
- `:name` -- machine-readable canonical value; use for writes, comparisons, and `where` filters.
- `:label` -- human-readable display string; use in the UI and activity log messages.

Always request both when a field will be displayed and also written or compared:

```typescript
select: ['status_id:name', 'status_id:label']
```

**Implicit joins** use dot notation to traverse a FK to another entity's field. Any FK field can be traversed this way:

```typescript
select: [
  'contact_id.display_name',        // Contact.display_name via CaseContact.contact_id
  'contact_id_b.display_name',      // Contact.display_name via Relationship.contact_id_b
  'case_id.subject',                 // Case.subject via CaseContact.case_id
  'group_id.title',                  // Group.title via GroupContact.group_id
]
```

Multi-level joins are valid: `contact_id.employer_id.display_name`.

### `where`

Each clause is a three-element tuple: `[field, operator, value]`.

```typescript
where: [
  ['case_type_id:name', '=', 'movement_view'],
  ['status_id:name', '=', 'Open'],
  ['id', 'IN', [1, 2, 3]],
  ['case_id', 'IS NOT NULL', null],   // null is required as the third element
]
```

**Common operators:**

| Operator | Value type | Notes |
|---|---|---|
| `=`, `!=`, `<`, `<=`, `>`, `>=` | scalar | Standard comparison |
| `IN`, `NOT IN` | `(string \| number)[]` | Value must be an array |
| `LIKE`, `NOT LIKE` | `string` | SQL LIKE pattern (`%` wildcard) |
| `IS NULL`, `IS NOT NULL` | `null` | Pass `null` as the third element -- the tuple must still have 3 items |
| `IS EMPTY`, `IS NOT EMPTY` | `null` | Checks for both NULL and empty string |
| `BETWEEN` | `[min, max]` | Value is a two-element array |

Use `:name` paths in `where`, not `:label` paths:

```typescript
// Correct -- filters on canonical value
['status_id:name', '=', 'Open']

// Wrong -- labels are localised and can change
['status_id:label', '=', 'Open']
```

### `orderBy`

Object map of `{ fieldPath: direction }`:

```typescript
orderBy: { subject: 'ASC' }
orderBy: { 'Circle_Case.Scorecard': 'DESC' }
```

### `limit` and `offset`

```typescript
limit: 20,    // return at most 20 records
offset: 40,   // skip the first 40 (page 3 of 20)
```

`limit: 0` (or omitting `limit`) means **no limit** -- all matching records are returned. This is the APIv4 default, unlike APIv3 which defaulted to 25.

### Counting records

Use `civiClient.count(entity, { where })`. It sends `select: ['row_count']` which returns a single aggregate record `{ row_count: N }` without fetching entity rows. This avoids a full-table scan and minimises payload size.

```typescript
// Correct
const total = await civiClient.count('Case', { where: caseWhere })

// Wrong -- fetches every matching row just to count them
const rows = await civiClient.get('Case', { select: ['id'], where: caseWhere, limit: 0 })
const total = rows.length
```

Never reproduce the `row_count` pattern inline -- always call `civiClient.count()`.

---

## 4. Entity inventory

This section lists every CiviCRM entity the application queries, with its confirmed valid fields. **Only use fields listed here.** Before adding a field not listed, verify it exists against the [CiviCRM API Explorer](#verifying-fields) and update this document.

### `Case`

Table: `civicrm_case`

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `subject` | `string` | Case title |
| `status_id` | `number` | FK to option group |
| `status_id:name` | `string` | Canonical status name -- use in `where` and writes |
| `status_id:label` | `string` | Display label -- use in UI |
| `case_type_id:name` | `string` | Used to filter by view; always include in `where` |
| `Circle_Case.*` | various | Custom field group; see sub-table below |

**`Circle_Case` custom fields:**

| Field | Type | Notes |
|---|---|---|
| `Circle_Case.Lead_Source` | `string \| null` | Option value |
| `Circle_Case.Lead_Source:name` | `string \| null` | Canonical value |
| `Circle_Case.Lead_Source:label` | `string \| null` | Display label |
| `Circle_Case.Profile` | `string \| null` | Option value |
| `Circle_Case.Profile:name` | `string \| null` | |
| `Circle_Case.Profile:label` | `string \| null` | |
| `Circle_Case.Notes` | `string \| null` | Free text |
| `Circle_Case.Mission_Values_Alignment` | `number \| null` | Scorecard sub-field (1--5) |
| `Circle_Case.Commitment_Reliability` | `number \| null` | Scorecard sub-field (1--5) |
| `Circle_Case.Facilitation_Distributed_Leadership` | `number \| null` | Scorecard sub-field (1--5) |
| `Circle_Case.Execution_Ability` | `number \| null` | Scorecard sub-field (1--5) |
| `Circle_Case.Relevant_Skills_Experience` | `number \| null` | Scorecard sub-field (1--5) |
| `Circle_Case.Overall_Fit` | `number \| null` | Scorecard sub-field (1--5) |
| `Circle_Case.Scorecard` | `number \| null` | **Read-only** -- computed average. Never write this field directly; strip it before calling `Case/update` (see `updateCase()` in `cases.ts`) |

---

### `CaseContact`

Table: `civicrm_case_contact`

Bridge entity linking a Case to its client Contacts. This is a **minimal bridge** -- it has exactly three fields.

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `case_id` | `number` | FK to `Case` |
| `contact_id` | `number` | FK to `Contact` |

**Via implicit join:**

| Path | Type | Notes |
|---|---|---|
| `contact_id.display_name` | `string` | Contact's full display name |
| `contact_id.email_primary` | `string` | Contact's primary email address |
| `case_id.subject` | `string` | The case's subject -- useful when querying from contact side |

> **There is no `role` field on `CaseContact`.** The `civicrm_case_contact` table does not have a role column. Case-participant roles for non-client contacts are expressed via `Relationship`, not via a field on this entity. Do not add `role` to any `select` array targeting `CaseContact`.

---

### `Contact`

Table: `civicrm_contact`

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `display_name` | `string` | Full formatted name |
| `first_name` | `string` | |
| `last_name` | `string` | |
| `email_primary` | `string` | Calculated shortcut to the primary email address. Supported as a **read field** (select/where), **write shortcut** in `create` (creates an Email record), and **filter** in `where`. Requires a recent CiviCRM 5.x version. |
| `contact_type` | `string` | `'Individual'`, `'Organization'`, or `'Household'` -- required on `create` |

**`email_primary` in `where`:** filtering on this field works via an implicit join. Use it to look up a contact by email address:

```typescript
where: [['email_primary', '=', 'user@example.com']]
```

**`email_primary` in `create` values:** creates a primary Email record atomically:

```typescript
civiClient.create('Contact', { contact_type: 'Individual', email_primary: 'user@example.com' })
```

---

### `Email`

Table: `civicrm_email`

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `contact_id` | `number` | FK to `Contact` |
| `email` | `string` | The email address |
| `is_primary` | `boolean` | Whether this is the contact's primary email |

Use `true`/`false` booleans consistently -- both in `where` filters and in `create`/`update` values:

```typescript
// Correct
where: [['is_primary', '=', true]]
values: { is_primary: true }

// Wrong -- numeric 1/0 works but is inconsistent with APIv4's typed fields
where: [['is_primary', '=', 1]]
```

---

### `Activity`

Table: `civicrm_activity`

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `activity_type_id` | `number` | FK to option group; set to `civiConfig.CMS_ACTIVITY_TYPE_ID` (80) for app-created activities |
| `subject` | `string` | Short description |
| `details` | `string` | Full text body |
| `activity_date_time` | `string` | ISO-like datetime; defaults to current time if omitted on create |
| `status_id` | `number` | FK to option group; use `civiConfig.ACTIVITY_STATUS_COMPLETED_ID` (2) |
| `status_id:label` | `string` | Display label |
| `source_contact_id` | `number` | The contact who performed the action |
| `source_contact_id.display_name` | `string` | Via implicit join |
| `case_id` | `number \| null` | Virtual field: the case linked to this activity via the `CaseActivity` bridge. Available for both `select` and `where`. Returns the first linked case if an activity is linked to multiple cases. |
| `target_contact_id` | `number[]` | Array of contact IDs. On `create`, CiviCRM creates `ActivityContact` records automatically. Pass as an array even for a single contact. |

---

### `Relationship`

Table: `civicrm_relationship`

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `contact_id_a` | `number` | FK to `Contact` -- typically the case client |
| `contact_id_b` | `number` | FK to `Contact` -- typically the coordinator |
| `relationship_type_id` | `number` | FK to `RelationshipType`; set to `civiConfig.COORDINATOR_RELATIONSHIP_TYPE_ID` (15) on create |
| `relationship_type_id:name` | `string` | Canonical name -- use `civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME` (`'Case Coordinator is'`) in `where` |
| `case_id` | `number \| null` | Mirror column present when CiviCase is enabled. Supported for `select` and `where`. |
| `contact_id_b.display_name` | `string` | Coordinator's display name via implicit join |

The coordinator filter requires both conditions to avoid matching unrelated relationships:

```typescript
where: [
  ['relationship_type_id:name', '=', civiConfig.COORDINATOR_RELATIONSHIP_TYPE_NAME],
  ['case_id', 'IS NOT NULL', null],
]
```

When **creating** a coordinator relationship, all three of `case_id`, `contact_id_a`, and `contact_id_b` are required:

```typescript
civiClient.create('Relationship', {
  case_id: Number(caseId),
  contact_id_a: leadContactId,         // must be the case's client contact
  contact_id_b: Number(coordinatorId),
  relationship_type_id: civiConfig.COORDINATOR_RELATIONSHIP_TYPE_ID,
})
```

---

### `GroupContact`

Table: `civicrm_group_contact`

Bridge entity linking Contacts to Groups, with a status representing membership state.

| Field | Type | Notes |
|---|---|---|
| `id` | `number` | Primary key |
| `group_id` | `number` | FK to `Group` |
| `contact_id` | `number` | FK to `Contact` |
| `status` | `string` | `'Added'`, `'Removed'`, or `'Pending'` -- always filter on `'Added'` when querying active memberships |
| `group_id.title` | `string` | Group display name via implicit join |

---

## 5. Instance-specific IDs

**File:** `src/lib/civicrm/config.ts`

CiviCRM stores relationship types, activity types, and option groups by numeric ID. These IDs are **instance-specific** -- they are set during CiviCRM installation and differ between environments. They are centralised in `civiConfig` so they have a single place to update when deploying to a new instance.

```typescript
export const civiConfig = {
  COORDINATOR_RELATIONSHIP_TYPE_ID: 15,        // relationship_type_id for "Case Coordinator is"
  COORDINATOR_RELATIONSHIP_TYPE_NAME: 'Case Coordinator is',  // used in WHERE clauses
  CMS_ACTIVITY_TYPE_ID: 80,                    // activity_type_id for CMS-logged activities
  ACTIVITY_STATUS_COMPLETED_ID: 2,             // status_id for "Completed" activities
} as const
```

**Rules:**
- Never hardcode these IDs inline. Always reference `civiConfig.*`.
- When adding a new type ID (e.g., a new custom field group, a new activity type), add it to `civiConfig` with a comment explaining what it maps to.
- After deploying to a new CiviCRM instance, verify every value in `civiConfig` against that instance's API Explorer before going live.

---

## 6. Query patterns and anti-patterns

### Parallel fetches

When two queries have no data dependency, fire them in parallel with `Promise.all`. This is the dominant pattern in this codebase:

```typescript
// Correct -- 2 round-trips in parallel
const [caseRows, total] = await Promise.all([
  civiClient.get<CiviCase>('Case', { select, where, limit: PAGE_SIZE, offset }),
  civiClient.count('Case', { where }),
])

// Wrong -- sequential, doubles latency for no reason
const caseRows = await civiClient.get(...)
const total = await civiClient.count(...)
```

When a second round of queries depends on IDs from the first (e.g., fetching CaseContacts after getting case IDs), use `Promise.all` within each round but keep the rounds sequential.

### `IN` filter over per-row fetches

When you need supplementary data for a page of records, fetch all rows in a single `IN` query rather than one call per record:

```typescript
// Correct -- 1 call for all cases on the page
const caseIds = caseRows.map((c) => c.id)
const contacts = await civiClient.get('CaseContact', {
  where: [['case_id', 'IN', caseIds]],
})

// Wrong -- N calls, one per case
for (const c of caseRows) {
  const contact = await civiClient.get('CaseContact', {
    where: [['case_id', '=', c.id]],
  })
}
```

### Counting records

Always use `civiClient.count()`. Never fetch all rows to count them:

```typescript
// Correct
const total = await civiClient.count('Activity', { where })

// Wrong -- fetches every row over the wire to get a number
const rows = await civiClient.get('Activity', { select: ['id'], where, limit: 0 })
const total = rows.length
```

### Selecting only what you need

Always specify `select`. Never omit it in production code:

```typescript
// Correct
select: ['id', 'contact_id_b', 'contact_id_b.display_name']

// Wrong -- returns every field on every row
// select omitted
```

When building select arrays dynamically (e.g., from a view config), use a `Set<string>` with `id` as a baseline, then spread it to an array:

```typescript
const paths = new Set<string>(['id'])
for (const field of view.fields) {
  paths.add(field.civiPath)
  if (field.civiLabelPath) paths.add(field.civiLabelPath)
}
return [...paths]
```

### Write values: strip read-only fields

Some fields are computed server-side and cannot be written. Strip them before calling `update`:

```typescript
// Circle_Case.Scorecard is computed from the six sub-fields -- never write it directly
const safeValues = { ...civiValues }
delete safeValues['Circle_Case.Scorecard']
await civiClient.update('Case', [['id', '=', Number(caseId)]], safeValues)
```

### Typing `where` values

Use the appropriate TypeScript type for the value element:

| Value | Correct TypeScript |
|---|---|
| String comparison | `string` |
| ID comparison | `number` (convert with `Number(id)` from string params) |
| Boolean field | `boolean` (`true` / `false`) |
| No-value operator (`IS NULL`, `IS NOT NULL`) | `null` |
| `IN` / `NOT IN` | `(string \| number)[]` |

Always convert string route params to `Number()` before passing as ID values. CiviCRM IDs are always numeric.

---

## Verifying fields

Before adding a field to a query, verify it exists on that entity. Use these methods in order:

1. **This document:** check the [Entity inventory](#4-entity-inventory) section first. If the field is listed, it is confirmed for this project's CiviCRM instance.

2. **CiviCRM official documentation:** search the [CiviCRM Developer Guide](https://docs.civicrm.org/dev/en/latest/) and the [CiviCRM Stack Exchange](https://civicrm.stackexchange.com/). The APIv4 entity/field reference and any linked GitHub PRs are authoritative sources for which fields exist and when they were introduced.

3. **Ask the user directly:** if documentation is ambiguous or the field is instance-specific (custom field groups, option group values, relationship type names), ask before writing code. The agent does not have access to the CiviCRM instance and cannot query it to verify field existence at runtime.

**Common mistakes to avoid:**

| Mistake | Correct approach |
|---|---|
| Using `CaseContact.role` -- this field does not exist | There is no role column in `civicrm_case_contact`. Case-participant roles are expressed via `Relationship`. |
| Assuming any APIv3 field exists in APIv4 | APIv3 and APIv4 have different entity/field surfaces. Verify in the v4 API Explorer. |
| Using `:label` in a `where` clause | Use `:name` for filtering; labels are localised. |
| Hardcoding a type/status/relationship ID | Add it to `civiConfig` with a comment; never inline a magic number. |

---

## 7. Adding a new query -- checklist

Use this checklist whenever you write a new CiviCRM call.

- [ ] **Entity exists in APIv4.** Verify via API Explorer or this document. APIv3 entities are not necessarily in APIv4.
- [ ] **All fields in `select` are confirmed valid** for that entity. Check the [Entity inventory](#4-entity-inventory) or API Explorer. Do not assume a field exists because it sounds right.
- [ ] **`where` values use `:name` paths**, not `:label`.
- [ ] **IDs use `Number()` conversion** from string params before passing to `where` values.
- [ ] **Boolean fields use `true`/`false`**, not `1`/`0`.
- [ ] **`IS NULL` / `IS NOT NULL` operators include `null` as the third tuple element.**
- [ ] **Counting uses `civiClient.count()`**, not a manual `limit: 0` + `rows.length`.
- [ ] **Independent queries run in parallel** via `Promise.all`.
- [ ] **Supplementary data for a page uses `IN`**, not a per-row loop.
- [ ] **Any new instance-specific ID is added to `civiConfig`**, not inlined.
- [ ] **Read-only computed fields are stripped** before `update` calls.
- [ ] **This document is updated** if you confirm a new field or entity that is not yet listed here.
