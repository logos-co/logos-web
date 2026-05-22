# `civi-crm` — Architecture Document

> Status: pre-implementation  
> Target mono-repo: `acid-info/logos-co`  
> Node ≥ 24, pnpm 11.1

---

## 1. Overview

`civi-crm` is a Next.js application that provides a lightweight read/write web layer on top of CiviCRM for Logos Circle Case management. It lives in `apps/civi-crm` inside the existing mono-repo, alongside `apps/web` and `apps/cms`.

CiviCRM is the sole data store — the application has no database of its own. Authentication is handled entirely by a Keycloak reverse proxy placed in front of the app by Infra; the application trusts it has already been authenticated and reads user identity from an HTTP header injected by the proxy.

The app exposes two pages:

| Route | Mode | Purpose |
|---|---|---|
| `/cases` | Read-only | Table list of all Circle Cases assigned to someone |
| `/cases/[id]` | Read + write | Detail view of a Case and its linked Contact Individual |

---

## 2. Placement in the Mono-repo

```
logos-co/
├── apps/
│   ├── cms/                # Payload CMS (existing)
│   ├── web/                # Logos.co website (existing)
│   └── civi-crm/           # CiviCRM web layer app
├── packages/
│   ├── config/             # Shared ESLint / TypeScript / Prettier config
│   ├── tokens/             # @acid-info/logos-tokens — CSS design tokens
│   ├── types/              # @repo/types — shared domain types (extend if needed)
│   └── ui/                 # @acid-info/logos-ui — shared React primitives
├── turbo.json
└── pnpm-workspace.yaml
```

The new app follows the same conventions as `apps/web`: Tailwind v4, `@acid-info/logos-ui`, `@acid-info/logos-tokens`, Vitest, and `@repo/config` for linting and TypeScript.

---

## 3. Tech Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | Next.js (same version as the rest of the mono-repo) | Server Components for data fetching, Route Handlers for the thin API layer |
| Styling | Tailwind v4 + `@acid-info/logos-tokens` + `@acid-info/logos-ui` | Consistent with `apps/web`; missing primitives are added to `packages/ui` |
| Language | TypeScript (strict null checks, bundler module resolution) | Consistent with `packages/config/typescript/base.json` |
| Testing | Vitest | Mutation-heavy app; Vitest is the better fit over `node --test` for mocking CiviCRM HTTP calls |
| Auth | Keycloak proxy (Infra-managed) | No credentials stored in the app |
| Database | None | CiviCRM is the sole data store |
| Linting | `@repo/config/eslint/next` | Same as `apps/web` |

---

## 4. File Architecture

```
apps/civi-crm/
├── .env.local.example
├── eslint.config.mjs
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tsconfig.json
│
└── src/
    │
    ├── app/                             # Next.js App Router
    │   ├── globals.css                  # Tailwind directives + token imports
    │   ├── layout.tsx                   # Root layout — metadata, providers, top nav
    │   ├── page.tsx                     # Redirect → /cases
    │   │
    │   ├── cases/
    │   │   ├── page.tsx                 # List page (Server Component)
    │   │   └── [id]/
    │   │       ├── page.tsx             # Detail page shell (Server Component)
    │   │       └── actions.ts           # Server Actions for mutations (Case + Contact)
    │   │
    │   └── api/
    │       ├── cases/
    │       │   ├── route.ts             # GET /api/cases?page=&assignee=&status=&sort=&order=
    │       │   └── [id]/
    │       │       ├── route.ts         # GET + PATCH /api/cases/[id]
    │       │       ├── activities/
    │       │       │   └── route.ts     # GET /api/cases/[id]/activities?page=
    │       │       └── coordinator/
    │       │           └── route.ts     # PATCH /api/cases/[id]/coordinator
    │       ├── contacts/
    │       │   └── [contactId]/
    │       │       └── route.ts         # PATCH /api/contacts/[contactId]
    │       └── coordinators/
    │           └── route.ts             # GET /api/coordinators
    │
    ├── components/
    │   ├── layout/
    │   │   └── AppNav.tsx               # Top navigation bar
    │   │
    │   └── cases/
    │       ├── CasesTable.tsx           # Client component — sortable, filterable table
    │       ├── CasesFilters.tsx         # Client component — filter/search bar
    │       ├── CaseDetailShell.tsx      # Client component — tabs + overall layout
    │       ├── CaseFields.tsx           # Editable Case fields form (status, profile, scores…)
    │       ├── ContactFields.tsx        # Editable Contact Individual fields form
    │       ├── Scorecard.tsx            # Read-only scorecard display (computed from scores)
    │       └── ActivityLog.tsx          # Read-only activity log — paginated via Pagination primitive
    │
    ├── constants/
    │   └── pagination.ts                # PAGE_SIZE = 20 — single source of truth for all paginated lists
    │
    ├── lib/
    │   ├── auth.ts                      # getCurrentUserEmail(req) — single seam for Keycloak header
    │   │
    │   ├── civicrm/
    │   │   ├── client.ts                # Typed HTTP client (fetch wrapper, auth header, error handling)
    │   │   ├── cases.ts                 # Case-entity queries (list, get-by-id, update)
    │   │   ├── contacts.ts              # Contact/CaseContact/GroupContact queries + update
    │   │   ├── activities.ts            # Activity queries + create
    │   │   ├── relationships.ts         # Relationship queries (coordinator get/swap)
    │   │   ├── coordinators.ts          # Deduplicated coordinator list query
    │   │   ├── scorecard.ts             # Pure function: compute scorecard average from scoring fields
    │   │   └── types.ts                 # Raw CiviCRM API response types
    │   │
    │   ├── activity-logger.ts           # Orchestrates CiviCRM Activity creation on mutations
    │   └── views.ts                     # View config registry + active-view resolution
    │
    └── types/
        ├── case.ts                      # Domain types: CaseListItem, CaseDetail, CaseUpdate
        └── contact.ts                   # Domain types: ContactDetail, ContactUpdate
```

---

## 5. View Configuration — Extensibility Layer

This is the central extensibility primitive. Every field rendered in the list and detail pages is derived from the active view's config. Adding a view for a new case type (e.g., Business Development) requires only adding an entry to the registry and setting the env var — no component changes.

### 5.1 Environment variable

```
ACTIVE_VIEW=movement_view   # server-only; change to switch the entire app to a different view
```

`src/lib/views.ts` reads `process.env.ACTIVE_VIEW` and resolves the active config. This is a build/deploy-time concern — a single value governs the whole deployment. Different deployments serve different views.

### 5.2 Type definitions (`src/lib/views.ts`)

```typescript
// The update target tells the write fan-out which CiviCRM entity to PATCH.
type UpdateTarget =
  | { entity: 'Case' }
  | { entity: 'Contact' }
  | { entity: 'Email' }          // native joined field requiring its own entity call
  | { entity: 'Relationship' }   // coordinator assignment — swap via delete + create, not a field write

type InputType =
  | 'text'
  | 'textarea'
  | 'select'
  | 'multiselect'
  | 'boolean'
  | 'score'       // integer 1–5, maps to a Scorecard scoring field
  | 'readonly'    // displayed but never written

type FieldDef = {
  key: string                    // unique identifier within the view
  // CiviCRM API field paths — both are needed: :name for writes and canonical values,
  // :label for display. Omit *Path when the field has no option list (plain text, bool).
  civiPath: string               // e.g. "Circle_Case.Notes", "status_id", "contact_id.email_primary"
  civiLabelPath?: string         // e.g. "status_id:label", "Circle_Case.Lead_Source:label"
  civiNamePath?: string          // e.g. "status_id:name", "Circle_Case.Lead_Source:name"
  label: string                  // human-readable display label
  inputType: InputType
  updateTarget: UpdateTarget
  isScorecard?: true             // marks one of the six fields contributing to Circle_Case.Scorecard
  skipSelect?: true              // when true, civiPath is NOT added to the Case select[] array
                                 // (used for Relationship-fetched fields like assignedTo)
}

type ListColumnDef = {
  fieldKey: string               // references a FieldDef.key
  sortable?: boolean
  width?: string                 // Tailwind width class
}

type DetailSectionDef = {
  title: string
  fields: string[]               // FieldDef.key references, in display order
}

type ViewConfig = {
  id: string
  label: string
  caseTypeName: string           // CiviCRM case_type_id:name value used in all /Case queries
  fields: FieldDef[]             // single registry for both list + detail
  listColumns: ListColumnDef[]
  detailSections: {
    case: DetailSectionDef[]
    contact: DetailSectionDef[]
  }
  scorecardFieldKeys: string[]   // exactly the six FieldDef.key values feeding the scorecard average
}
```

### 5.3 `movement_view` view config (abbreviated)

```typescript
const movementView: ViewConfig = {
  id: 'movement_view',
  label: 'Movement View',
  caseTypeName: 'movement_view',

  scorecardFieldKeys: [
    'missionValuesAlignment',
    'commitmentReliability',
    'facilitationDistributedLeadership',
    'executionAbility',
    'relevantSkillsExperience',
    'overallFit',
  ],

  fields: [
    {
      key: 'subject',
      civiPath: 'subject',
      label: 'Subject',
      inputType: 'text',
      updateTarget: { entity: 'Case' },
    },
    {
      key: 'status',
      civiPath: 'status_id',
      civiLabelPath: 'status_id:label',
      civiNamePath: 'status_id:name',
      label: 'Status',
      inputType: 'select',
      updateTarget: { entity: 'Case' },
    },
    {
      key: 'leadSource',
      civiPath: 'Circle_Case.Lead_Source',
      civiLabelPath: 'Circle_Case.Lead_Source:label',
      civiNamePath: 'Circle_Case.Lead_Source:name',
      label: 'Lead Source',
      inputType: 'select',
      updateTarget: { entity: 'Case' },
    },
    // … profile, notes, six scoring fields (isScorecard: true), email_primary (updateTarget: Email), etc.
    {
      key: 'emailPrimary',
      civiPath: 'contact_id.email_primary',
      label: 'Email',
      inputType: 'text',
      updateTarget: { entity: 'Email' },
    },
  ],

  listColumns: [
    { fieldKey: 'subject', sortable: true },
    { fieldKey: 'status', sortable: true },
    { fieldKey: 'leadSource', sortable: true },
    { fieldKey: 'scorecard', sortable: true, width: 'w-24' },
    { fieldKey: 'assignedTo', sortable: false },
  ],

  detailSections: {
    case: [
      { title: 'Case', fields: ['status', 'leadSource', 'profile', 'notes'] },
      { title: 'Scorecard', fields: ['missionValuesAlignment', 'commitmentReliability', 'facilitationDistributedLeadership', 'executionAbility', 'relevantSkillsExperience', 'overallFit'] },
    ],
    contact: [
      { title: 'Contact', fields: ['emailPrimary', 'city', 'country', 'chatService', 'chatName', 'website'] },
      { title: 'Skills & Experience', fields: ['skillsExperience', 'circleAffiliation', 'affiliatedOrgs'] },
      { title: 'Open Questions', fields: ['informedAboutEvents', 'subscribedToNewsletter' /* … */] },
    ],
  },
}
```

---

## 6. CiviCRM Client Layer

### 6.1 HTTP client (`src/lib/civicrm/client.ts`)

A thin `fetch` wrapper. Holds `CIVICRM_BASE_URL` and `CIVICRM_API_KEY` from server-only env vars. All CiviCRM communication passes through here.

```typescript
// Conceptual interface — not implementation
type CiviWhereValue = boolean | number | string | null

type CiviWhere = [string, string, CiviWhereValue | CiviWhereValue[]]

type CiviParams = {
  select?: string[]
  where?: CiviWhere[]
  orderBy?: [string, 'ASC' | 'DESC'][]
  limit?: number
  offset?: number
}

class CiviCRMClient {
  get<T>(entity: string, params: CiviParams): Promise<T[]>
  create<T>(entity: string, values: Record<string, unknown>): Promise<T>
  update<T>(entity: string, where: CiviWhere[], values: Record<string, unknown>): Promise<T[]>
  delete(entity: string, where: CiviWhere[]): Promise<void>
  count(entity: string, params: Pick<CiviParams, 'where'>): Promise<number>
}
```

The client throws a typed `CiviCRMError` on non-2xx responses, carrying status code and CiviCRM's error object. Route handlers catch this and translate to appropriate HTTP responses.

Authentication uses the `X-Civi-Auth: Bearer <key>` header on every request.

For query patterns, valid entities and fields, operators, and anti-patterns see [`docs/civi-crm/api.md`](api.md).

### 6.2 Scorecard computation (`src/lib/civicrm/scorecard.ts`)

Pure function, no I/O — trivially unit-testable.

```typescript
// computeScorecard(scores: Record<string, number | null>): number | null
// Returns the average of non-null values among the six scoring fields,
// rounded to two decimal places. Returns null if all fields are null.
```

### 6.3 CiviCRM field path convention

CiviCRM APIv4 uses two suffixes that the view config tracks explicitly:
- `:name` — machine-readable canonical value (used for filtering, writing, comparisons)
- `:label` — human-readable display string (used in UI, activity log messages)

Both must be requested in `select[]` and both are stored in domain types. Writes always use the unsuffixed path or `:name`.

---

## 7. API Routes

All routes are Next.js Route Handlers in `src/app/api/`. They act as a thin backend — holding secrets, merging multi-entity responses, and never exposing CiviCRM credentials to the browser.

### 7.1 Route table

| Method | Route | CiviCRM calls | Notes |
|---|---|---|---|
| `GET` | `/api/cases?page=&assignee=&status=&sort=&order=` | 3 parallel: `/Case` + `/CaseContact` + `/Relationship` | Filtered by active view's `caseTypeName`; merged server-side by `case_id`; paginated (page size 20); `assignee` defaults to logged-in coordinator |
| `GET` | `/api/cases/[id]` | Round 1 (4 parallel): `/Case` + `/CaseContact` (deep join) + `/Relationship`; Round 2 (2 parallel, after `contact_id` resolves): `/CaseContact` (other cases) + `/GroupContact` | Activity log excluded from this route — fetched separately |
| `GET` | `/api/cases/[id]/activities?page=` | `/Activity` paginated (page size 20) | Separate route keeps detail page fast on cases with many activities |
| `PATCH` | `/api/cases/[id]` | Fan-out per update target; scorecard computed and included in same `/Case` write | Write fan-out described in §7.3 |
| `PATCH` | `/api/cases/[id]/coordinator` | Delete old `/Relationship` + create new `/Relationship` | Non-atomic; failure mode described in §9.3 |
| `PATCH` | `/api/contacts/[contactId]` | Fan-out per update target; `/Contact` for `Skills_Socials` fields + parallel `/Email` for `email_primary` | |
| `GET` | `/api/coordinators` | `/Relationship` (all with `case_id IS NOT NULL` + `Case Coordinator is`) → deduplicated | Used for filter dropdown |

### 7.2 `GET /api/cases` — optimised fetch

Rather than fetching supplementary data per-case:

1. Fetch one page of `/Case` records for the active view's `caseTypeName`, using `limit: 20` and `offset: (page - 1) * 20`. The CiviCRM response includes a `count` field for total results, which is forwarded to the client for pagination controls.
2. Extract the list of `case_id`s from that page.
3. In parallel: fetch `/CaseContact` with `case_id IN [...]` (lead names) and `/Relationship` with `case_id IN [...] AND relationship_type_id:name = "Case Coordinator is"` (assigned-to).
4. Merge three result sets server-side into `CaseListItem[]`.

This is 3 total CiviCRM calls per page regardless of total case count.

**Default assignee filter:** On first load the Server Component reads the logged-in user's email via `getCurrentUserEmail()`, resolves their CiviCRM coordinator `contact_id` (via `/Relationship`), and passes it as the default `?assignee=` search param. The user can clear the filter in `CasesFilters` to see all cases. The resolved `contact_id` is passed as the `assignee` query parameter to this route, which applies it as an additional `where` clause on the `/Relationship` call.

**`select[]` arrays are derived server-side from the active view's `listColumns` field definitions**, ensuring only needed fields are fetched.

### 7.3 Write fan-out (`PATCH /api/cases/[id]` and `PATCH /api/contacts/[contactId]`)

PATCH handlers accept a flat payload of `{ fieldKey: newValue }` keyed by `FieldDef.key`.

The handler:
1. Resolves each key against the active view's `FieldDef.updateTarget`.
2. Groups changed fields by update target entity.
3. Fires all write calls in parallel (e.g., one `/Case` update + one `/Email` update at the same time).
4. For any Case write that includes one or more `isScorecard` fields: the handler **requires the full set of six scoring values in the payload** (the client must always send the complete scoring object, not a partial diff). `scorecard.ts` computes the average and it is included in the same `/Case` write as `Circle_Case.Scorecard`.
5. After **all** writes succeed, fires `activity-logger.ts` to create the CiviCRM Activity entry.

**Partial failure policy:** If one parallel write fails, others may have already committed (CiviCRM provides no distributed transaction). The handler returns a `207 Multi-Status` response with per-entity status objects. The client surfaces which fields failed. There is no application-level rollback in v1 — operators resolve inconsistencies manually if needed. **No activity log entry is created when any write fails** — the 207 is returned immediately without calling `activity-logger.ts`.

### 7.4 `select[]` construction

For each API call, the `select[]` array is never hardcoded in route handlers. It is built server-side from the view config's field list, requesting both `:label` and `:name` variants for option-list fields. This ensures:
- Only fields needed by the active view are fetched.
- Adding a field to a view config automatically includes it in the API call.
- No risk of missing or redundant fields being requested.

---

## 8. Authentication & User Identity

Keycloak is a reverse proxy in front of the entire app. The application can assume every request is already authenticated.

User identity is read from a single helper:

```typescript
// src/lib/auth.ts
export function getCurrentUserEmail(req: Request): string | null {
  // DEV_USER_EMAIL_MOCK is only honoured outside production — guards against misconfigured secrets.
  // Set it to your own email in .env.local during local development.
  if (process.env.NODE_ENV !== 'production' && process.env.DEV_USER_EMAIL_MOCK)
    return process.env.DEV_USER_EMAIL_MOCK

  // Header default is 'x-auth-request-email' — a common Keycloak / oauth2-proxy convention.
  // The exact header name Infra will use is TBD; when confirmed, update
  // KEYCLOAK_USER_EMAIL_HEADER in the deployment env and only this function changes.
  return req.headers.get(process.env.KEYCLOAK_USER_EMAIL_HEADER ?? 'x-auth-request-email')
}
```

`KEYCLOAK_USER_EMAIL_HEADER` controls the header name (default `x-auth-request-email`). `DEV_USER_EMAIL_MOCK` short-circuits header reading in non-production environments only, preventing accidental auth bypass if the variable were ever set in a staging/production deployment. The actual header name Infra will inject remains TBD — see §17.

---

## 9. Activity Logging

Since Keycloak cannot be integrated as a CiviCRM OIDC provider, activity authorship is tracked by creating CiviCRM `/Activity` entries via API.

### 9.1 `activity-logger.ts`

```typescript
type FieldChange = { key: string; label: string; from: unknown; to: unknown }
type ActivityTarget =
  | { type: 'case'; caseId: string; contactId: string }
  | { type: 'contact'; contactId: string }

// logActivity(userEmail: string, target: ActivityTarget, changes: FieldChange[]): Promise<void>
//
// Resolves (or creates) a CiviCRM Contact for `userEmail`, then creates
// an Activity with subject summarising the changes.
// Called from all PATCH handlers AFTER successful writes.
// Activity creation failure is logged but does not fail the mutation response.
```

The subject line format: `*{FirstName}* updated: {field1} → {value1}, {field2} → {value2}` (human-readable labels from `:label` paths).

### 9.2 CiviCRM Activity entity mapping

All civi-crm-created activity entries use `activity_type_id: 80`.

| Target type | CiviCRM call |
|---|---|
| Case mutation | `POST /Activity` with `activity_type_id: 80` + `case_id` + `source_contact_id` (resolved from email) |
| Contact mutation | `POST /Activity` with `activity_type_id: 80` + `target_contact_id: [contactId]` + `source_contact_id` |

`source_contact_id` is resolved by searching `/Contact` by `email_primary` = user email. If not found, a Contact is created on the fly.

### 9.3 Coordinator swap failure mode

`PATCH /api/cases/[id]/coordinator`:
1. Deletes the existing `/Relationship` record.
2. Creates the new `/Relationship` record.

This is non-atomic. If step 2 fails after step 1 succeeds, the Case has no coordinator. The handler returns a 500 with a descriptive message indicating which step failed. The activity log entry is only created if both steps succeed. Recovery is a manual Infra/ops concern — no automatic retry in v1.

---

## 10. Pages & Components

### 10.1 Server / Client boundary

| Location | Rendering | Rationale |
|---|---|---|
| `app/cases/page.tsx` | Server Component | Fetches list from `/api/cases` with searchParams-driven filters; data flows as props |
| `app/cases/[id]/page.tsx` | Server Component (shell) | Fetches case detail; passes serialised data to client form components |
| `components/cases/CasesTable.tsx` | Client Component | Sort/filter interactions |
| `components/cases/CasesFilters.tsx` | Client Component | Filter bar (controlled by URL search params — shareable links) |
| `components/cases/CaseDetailShell.tsx` | Client Component | Tab switching, optimistic UI |
| `components/cases/CaseFields.tsx` | Client Component | Controlled form; calls Server Actions on submit |
| `components/cases/ContactFields.tsx` | Client Component | Controlled form; calls Server Actions on submit |
| `components/cases/ActivityLog.tsx` | Client Component | Client-side fetches `GET /api/cases/[id]/activities?page=` on page change; initial page may be pre-fetched by the Server Component shell and passed as a prop to avoid a waterfall on first render |
| `app/cases/[id]/actions.ts` | Server Actions | `updateCase()`, `updateContact()`, `swapCoordinator()` — validate, call API, revalidate cache |

Mutations go through **Server Actions** (not direct `/api/*` fetch from client). Route handlers exist for the API surface (used by Server Actions internally and potentially by future external callers). Server Actions call the same CiviCRM client functions that the route handlers use.

### 10.2 URL state

Filter, sort, and pagination state lives in URL search params. This makes list views shareable and bookmarkable. `CasesFilters` uses `useRouter` / `useSearchParams` to update params without a full navigation.

| Param | Page | Default | Notes |
|---|---|---|---|
| `page` | `/cases` | `1` | List pagination |
| `status` | `/cases` | — | Filter by case status |
| `assignee` | `/cases` | logged-in coordinator's `contact_id` | Pre-populated server-side from Keycloak identity on first render; clearable by the user |
| `sort` | `/cases` | `subject` | Column to sort by |
| `order` | `/cases` | `asc` | `asc` or `desc` |
| `activitiesPage` | `/cases/[id]` | `1` | Activity log pagination |

The `assignee` default is resolved once in the Server Component (`app/cases/page.tsx`) by calling `getCurrentUserEmail()`, looking up the coordinator's `contact_id`, and injecting it as a default into the rendered `CasesFilters` component. Subsequent filter changes are fully client-side via URL params.

### 10.3 Component field rendering

`CaseFields` and `ContactFields` are driven by the active view config's `detailSections`. They iterate over section definitions and render each field by inspecting its `inputType`:
- `score` → a 1–5 integer input or segmented control
- `select` / `multiselect` → dropdown populated from CiviCRM option values (fetched once at page load, colocated with the detail response)
- `boolean` → toggle
- `text` / `textarea` → standard inputs
- `readonly` → display-only

Adding a new field to a view config section automatically renders it without any component changes.

---

## 11. Caching Strategy

| Route | Strategy | Invalidation |
|---|---|---|
| `GET /api/cases` | `revalidateTag('cases')` | After any successful Case or coordinator mutation |
| `GET /api/cases/[id]` | `cache: 'no-store'` | Always fresh — detail view must reflect latest state |
| `GET /api/coordinators` | `revalidateTag('coordinators')`, long TTL | Changes rarely; invalidated when coordinator relationships change |

Scorecard writes revalidate both `'cases'` (list shows updated score) and the individual case detail tag.

---

## 12. Concurrency

**v1: last-write-wins.** There is no optimistic concurrency control, no field-level locking, and no CiviCRM-side transaction. Simultaneous edits by two users will result in the last submitted write prevailing. This is an accepted trade-off for v1 given the small team of coordinators using the tool. A future iteration could add ETag-based concurrency if it proves to be a real problem.

---

## 13. Environment Variables

```bash
# .env.local.example

# CiviCRM connection — server-only, never exposed to the browser
CIVICRM_BASE_URL=
CIVICRM_API_KEY=

# View configuration — determines which case type and field set the app serves
# Corresponds to a key in the views registry in src/lib/views.ts
ACTIVE_VIEW=movement_view

# Keycloak proxy header — default 'x-auth-request-email' (common oauth2-proxy convention).
# Update once Infra confirms the exact header name for the production proxy.
KEYCLOAK_USER_EMAIL_HEADER=

# Development mock: when set, getCurrentUserEmail() returns this value instead of reading
# the Keycloak header. Use in .env.local during local development.
# Remove or leave unset in staging/production.
DEV_USER_EMAIL_MOCK=
```

No `NEXT_PUBLIC_` prefixed env vars are needed — all CiviCRM communication is server-side.

---

## 14. Mono-repo Integration

### `package.json` scripts (follow `apps/web` conventions)
```json
{
  "scripts": {
    "dev": "next dev --port 3002",
    "build": "next build",
    "start": "next start",
    "lint": "eslint . --max-warnings 0",
    "lint:fix": "eslint . --fix",
    "check-types": "tsc --noEmit",
    "test": "vitest run"
  }
}
```

### `turbo.json` additions (root)
The `civi-crm` app requires no additions to `turbo.json` tasks beyond the existing `build`, `dev`, `lint`, `check-types`, and `test` tasks. Add the app-specific env vars to the `build.env` array:
```json
"CIVICRM_BASE_URL", "CIVICRM_API_KEY", "ACTIVE_VIEW", "KEYCLOAK_USER_EMAIL_HEADER", "DEV_USER_EMAIL_MOCK"
```

### Workspace dependencies
```json
{
  "dependencies": {
    "@acid-info/logos-tokens": "workspace:*",
    "@acid-info/logos-ui": "workspace:*",
    "next": "<same version as apps/web>",
    "react": "^19.x",
    "react-dom": "^19.x"
  },
  "devDependencies": {
    "@repo/config": "workspace:*",
    "@types/node": "<same version as other apps>",
    "@types/react": "^19.x",
    "vitest": "^4.x",
    "typescript": "^6.x",
    "tailwindcss": "^4.x",
    "@tailwindcss/postcss": "^4.x"
  }
}
```

---

## 15. Testing Strategy

| Layer | What to test | How |
|---|---|---|
| `lib/civicrm/scorecard.ts` | Pure computation correctness (all null, partial null, rounding) | Vitest unit tests |
| `lib/civicrm/client.ts` | Error handling, auth header injection, JSON parse | Vitest with `vi.mock(fetch)` |
| `lib/civicrm/cases.ts` etc. | Query construction (correct `select[]`, `where[]`) | Vitest with mocked client |
| `lib/activity-logger.ts` | Activity subject formatting, on-the-fly contact creation path | Vitest unit tests |
| `lib/views.ts` | View config resolution, field key uniqueness | Vitest unit tests |
| API route handlers | Integration: correct fan-out, 207 on partial failure, scorecard write | Vitest with mocked CiviCRM client |
| Server Actions | Input validation, revalidation calls | Vitest |
| UI components | Smoke tests for field rendering from view config | Vitest + React Testing Library (if needed) |

No end-to-end tests against a live CiviCRM in v1 — all CiviCRM calls are mocked at the `CiviCRMClient` boundary.

---

## 16. Styling Conventions

Follow `apps/web`:
- Tailwind v4 utility classes
- Design tokens from `@acid-info/logos-tokens` via CSS custom properties (imported in `globals.css`)
- `@acid-info/logos-ui` primitives for shared components (Button, Table, Pagination, etc.)
- If a required primitive is missing from `packages/ui`, add it there rather than duplicating in the app

`globals.css`:
```css
@import 'tailwindcss';
@import '@acid-info/logos-tokens/theme.css';
@import '@acid-info/logos-ui/styles.css';

/* Scan the shared UI package so its Tailwind classes are emitted. */
@source "../../../packages/ui/src/**/*.{ts,tsx}";
```

Tailwind v4 is activated by `@import 'tailwindcss'` — the old `@tailwind base/components/utilities` directives are a v3 pattern and must not be used.

---

## 17. Open Questions

All initial open questions have been resolved and folded into the relevant sections above.

| # | Question | Resolution |
|---|---|---|
| 1 | Keycloak header name | TBD from Infra; defaulting to `x-auth-request-email`. `DEV_USER_EMAIL_MOCK` mocks it locally. |
| 2 | Pagination | Both list view and activity log are paginated at **page size 20**. |
| 3 | Activity entries on failed writes | No activity entry is created when any write fails (§7.3, §9.1). |
| 4 | Pre-filter by logged-in coordinator | Yes — `?assignee=` defaults to the current user's coordinator `contact_id` (§7.2, §10.2). |
| 5 | `activity_type_id` for civi-crm entries | **80** (§9.2). |

---

## 18. Potential Follow-ups (from TDD)

- **Business Development Cases view** — Add a second `ViewConfig` entry in `src/lib/views.ts`. Deploy a separate instance with `ACTIVE_VIEW=business_development`. No component changes required unless BD Cases need novel input types.
- **Kanban view for `/cases`** — Add a `viewMode` query param (`?mode=kanban`). `CasesTable` and a new `CasesKanban` component both receive the same server-fetched data; the Server Component passes it to whichever is active.
- **Multi-view switcher within one deployment** — Move `ACTIVE_VIEW` from an env var to a user-session preference if multiple case types need to be accessible from a single deployment. This is a deliberate future upgrade, not a v1 requirement.
