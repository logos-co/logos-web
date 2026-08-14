# Logos CRM - Frontend Specification

## 1. Frontend goals

The first release is an authenticated internal workspace for finding people, organisations, and cases quickly. It must favour dense, readable operational views over marketing-style layouts.

Use `@acid-info/logos-ui`, `@acid-info/logos-tokens`, and Tailwind CSS v4. New primitives belong in `packages/ui`; CRM-specific composition stays in `apps/logos-crm`.

Recommended frontend packages:

| Package                   | Use                                                                            |
| ------------------------- | ------------------------------------------------------------------------------ |
| `@acid-info/logos-ui`     | Existing Logos Button, Table, Pagination, IconButton, Card, marks, and icons   |
| `@acid-info/logos-tokens` | Brand colours, typography, spacing, and themes                                 |
| `react-aria-components`   | Accessible behaviour for new Logos form, dialog, tabs, and combobox primitives |
| `@tanstack/react-query`   | Client cache, fetching, mutations, and invalidation                            |
| `@tanstack/react-table`   | Server-side CRM tables                                                         |
| `nuqs`                    | Shared typed URL state for filters, sorting, pagination, and report parameters |
| `react-hook-form`         | Forms and dirty-state tracking                                                 |
| `zod`                     | Form refinements and shared Next.js/Drizzle contract validation                |
| `recharts`                | Self-hosted dashboard charts                                                   |

Chart and export data remains inside the Docker Compose deployment. No hosted analytics, charting, export, or notification platform is required.

The `admin-acid` dashboard is a behavioural reference for the sidebar shell, debounced search, server-backed tables, comboboxes, import progress, confirmation dialogs, and structured error feedback. Logos CRM does not copy its visual system, password gate, Redis jobs, or Vercel-specific behaviour.

Client Components call Next.js Route Handlers through a small shared `api-client` helper wrapped by TanStack Query. The helper handles JSON, the common error envelope, request IDs, and cancellation; it is not a generated SDK or generic repository. Request and response types are inferred from shared Zod schemas rather than duplicated. `nuqs` parser declarations are shared by Server and Client Components, while Route Handler Zod validation remains authoritative.

The current Logos UI package does not yet provide all CRM controls. Before implementation, Figma-backed `Input`, `Textarea`, `Select`, `Combobox`, `Dialog`, `Drawer`, `Tabs`, `Badge`, `Toast`, `Checkbox`, `DateInput`, and `FormField` primitives must be added to `@acid-info/logos-ui`; accessible interaction behaviour may use `react-aria-components`. Do not substitute missing designed icons with Unicode characters.

This is an implementation gate: each new shared primitive needs an approved Figma node/export and responsive/interaction states before UI implementation starts. Feature work may proceed on server contracts and unstyled test fixtures while design inputs are pending, but the production UI cannot invent the missing visual specification.

All visible labels, validation messages, empty states, and metadata use `next-intl` message keys. The initial locale is English.

## 2. Application shell

All authenticated routes share:

- a persistent left navigation on desktop;
- a compact top bar and drawer navigation on mobile;
- the current user's name and role;
- a global search entry point;
- a notification/status area;
- a skip link, visible focus states, keyboard navigation, and semantic landmarks.

Primary navigation:

1. Dashboard
2. Cases
3. People
4. Organisations
5. Activities
6. Tasks
7. Reports (leadership permissions)
8. Imports (admin only)
9. Settings

The shell must not expose navigation items that the current user cannot access, but the API remains the source of truth for authorisation.

## 3. Required screens

### Dashboard `/`

Shows the user's operational summary:

- cases assigned to the current user;
- cases requiring attention;
- recently updated records;
- failed or pending actions created by the current user.

Cards link to filtered list views. Dashboard data can be partial; a failed secondary panel must not make the whole page unusable.

“Requiring attention” means cases with an overdue open task, no contact within the configured threshold, or a workflow status explicitly marked as requiring attention. “Pending actions” means open tasks assigned to the current user.

### Global search

The shell search queries `GET /api/v1/search?q=` after a short debounce. Results are grouped into People, Organisations, Cases, and Tasks and support keyboard navigation. The UI does not reveal inaccessible result counts or placeholders.

### Cases `/cases`

Server-render the initial page and query subsequent changes through TanStack Query.

Required controls:

- free-text search;
- status filter;
- assignee filter;
- organisation/person filter;
- updated date range;
- sortable columns;
- pagination;
- clear filters;
- create case action when permitted.

The table must preserve filters in the URL. Each row links to `/cases/[id]`. Loading, empty, error, and permission-denied states are explicit.

### Case detail `/cases/[id]`

Sections:

- case summary and status;
- assignee and related people/organisations;
- editable case fields;
- activity timeline;
- audit history for permitted roles.

Edits use a form with field-level validation, dirty-state protection, optimistic-concurrency handling, and a visible success/error result. Activity creation is separate from editing core case fields.

For Ecodev cases, v1 exposes only these custom fields: stage, substatus, owner, business unit, platform, tags, source, priority, summary notes, last contact, and validation status. Segment, user-persona type, and the full activity-type taxonomy are deferred.

The Ecodev list defaults to these columns: opportunity, stage/substatus, owner, business unit, platform, source, priority, last contact, validation status, and updated time. Filters cover each controlled field plus tags and last-contact date range. The detail view groups fields into opportunity, ownership, qualification, relationships, and activity sections.

| Field             | Control              | List/filter behaviour               |
| ----------------- | -------------------- | ----------------------------------- |
| Stage             | Select               | visible, filterable, sortable       |
| Substatus         | Dependent select     | visible and filterable              |
| Owner             | Coordinator combobox | visible and filterable              |
| Business unit     | Select               | visible and filterable              |
| Platform          | Multiselect          | visible and filterable              |
| Tags              | Token multiselect    | filterable                          |
| Source            | Select               | visible and filterable              |
| Priority          | Select               | visible, filterable, sortable       |
| Summary notes     | Textarea             | detail only                         |
| Last contact      | Date input           | visible, range-filterable, sortable |
| Validation status | Select               | visible and filterable              |

### People `/people` and `/people/[id]`

The list supports search, organisation, status, and pagination. The detail page shows contact methods, organisation relationships, linked cases, and recent activities. Sensitive fields are hidden or redacted according to the permission policy.

Create and edit forms support multiple labelled contact methods, one preferred method per type, and a suppression state that prevents future messaging. Users with merge permission can review duplicate suggestions side-by-side, select the surviving values, enter a reason, and confirm a merge. Administrators see a separate anonymisation action only when the approved retention policy permits it.

### Organisations `/organisations` and `/organisations/[id]`

The list supports name search and pagination. The detail page shows contact people, linked cases, notes, and recent activities.

Organisation creation shows possible duplicates by normalised name and domain. A merge uses the same explicit survivor/value-selection flow as people.

### Activities `/activities`

An audit-friendly, read-oriented timeline with filters for actor, type, date, and linked record. Activity creation is available from a linked case, person, or organisation rather than only from this global list.

Case notes remain plain text in v1 and support `@username` mentions. The editor offers an accessible listbox autocomplete from `GET /api/v1/coordinators?q=`; the server parses and validates mentions on submit. Mention candidates show display name, username, team, and enabled delivery channels without exposing Discord IDs.

The activity form includes a visibility choice of private, team, or shared. Mention autocomplete only returns users who can access the selected visibility and linked record.

### Tasks `/tasks`

The task list defaults to the current user's incomplete tasks and supports assignee, status, priority, due-date, overdue, and linked-record filters. Tasks can be created from a case, person, or organisation and completed from either the task list or parent detail page. Overdue and due-soon states use text and icons in addition to colour.

### Reports `/reports`

Reports are filterable by created-cohort date range, explicit `as_of` time, timezone, case type, status, owner/team, source, business unit, and platform. The initial surface includes funnel counts at `as_of`, stage-to-stage cohort progression, median time in stage, active onboarding count, approved-versus-redirected outcomes, lead-source breakdown, owner/team breakdown, created-case growth over time, and cross-team visibility with shared notes, owners, relationships, and timeline.

Every chart has a table alternative, metric definition, timezone, date range, and last-updated timestamp. CSV and XLSX exports use the active filters and are generated by the server. The legacy binary `.xls` format is not generated; XLSX is the Excel export format for this requirement.

Cross-team visibility lives at `/reports/visibility` and shows the selected case with shared notes, current and historical owners, related people/organisations, and a permission-filtered timeline.

### Export actions

Filtered People, Cases, Activities, and Reports views expose an export action to users with `exports:create`. The confirmation displays resource, active filters, selected columns, format, and timezone. The result panel shows queued/running/completed/failed/expired state and provides an authenticated download only when completed.

### Imports `/imports` (admin)

Shows migration runs, progress, counts, errors, and reconciliation results. Upload accepts CSV, shows required headers and limits, and creates a preview with create/update/conflict/error counts plus downloadable safe errors. Commit requires explicit confirmation of the preview checksum. Large imports continue in the worker and the page polls status; retry resumes from an idempotent checkpoint.

### Settings `/settings`

All active users can choose email and Discord mention-delivery preferences. Administrators can review pending users, activate or suspend users, assign fixed roles and teams, maintain status/stage/source/priority catalogues, and manage Discord identity/channel mappings. Discord settings are hidden when `DISCORD_ENABLED=false`. Personal-data deletion is a separate confirmed admin workflow and is never represented as a normal archive toggle.

## 4. Client data and mutation rules

- Server Components load the initial view through service functions.
- Client Components use TanStack Query for interactive reads and mutations.
- Query keys include all `nuqs`-parsed filter, sort, and pagination state.
- Mutations invalidate affected resource and dashboard queries.
- Forms use React Hook Form and Zod contracts shared with the server where practical.
- No Redux or Zustand is needed for v1.
- URL state is canonical for list filters; local component state is limited to transient UI state.
- Report queries and exports include a serialised filter object so results can be reproduced and audited.

## 5. Responsive and accessibility requirements

- Desktop tables may scroll horizontally; columns must not silently disappear when data is important.
- On mobile, tables become stacked record summaries with the same actions.
- Destructive actions require a confirmation step and explain the consequence.
- Every clickable element has `cursor-pointer` and a visible focus treatment.
- Dialogs trap focus and restore it to the trigger on close.
- All server errors have a human-readable message and a retry path where retry is safe.

## 6. Frontend acceptance tests

Playwright must cover:

1. authenticated navigation and role-based route visibility;
2. case filtering, pagination, detail navigation, and editing;
3. creating an activity from a case;
4. permission denial for a restricted mutation;
5. stale-edit conflict handling;
6. mobile navigation and a usable case detail view;
7. import preview and admin-only access;
8. Ecodev fields and deferred-field absence;
9. report filters, chart/table parity, and filtered CSV/XLSX export;
10. mention autocomplete, notification confirmation, and deep-link navigation;
11. global search without inaccessible-result leakage;
12. task creation, completion, overdue filtering, and dashboard attention counts;
13. duplicate review and merge with relationship preservation;
14. user suspension, fixed-role assignment, and catalogue administration;
15. import preview, checksum confirmation, progress, and row-error download.
