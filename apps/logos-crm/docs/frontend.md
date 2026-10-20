# Logos CRM frontend

Current-state reference for the UI of `apps/logos-crm`: the routes in [`src/app`](../src/app), the
components in [`src/components`](../src/components), and the API client in
[`src/lib/api-client.ts`](../src/lib/api-client.ts).

## Screens

| Route                 | Screen                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| `/`                   | Dashboard: open work, needs-attention list, pipeline                       |
| `/cases`              | Case queue with search, status filter, and create dialog                   |
| `/cases/[id]`         | Case detail: next action, status progression, related people, work history |
| `/people`             | People directory with search and create dialog                             |
| `/people/[id]`        | Person detail with edit, contact, and work history                         |
| `/organisations`      | Organisations directory with search and create dialog                      |
| `/organisations/[id]` | Organisation detail with edit and work history                             |

There are no `/activities`, `/tasks`, `/reports`, `/imports`, or `/settings` screens.

## Components

- `crm-shell.tsx`: the sidebar layout, primary navigation, skip link, and brand mark. It also
  prefetches the dashboard, people, and organisations counts for the nav badges.
- `crm-demo.tsx`: the cases table (TanStack Table) plus the search and status filters and the new
  case dialog.
- `dashboard-view.tsx`: the dashboard panels, derived from the same cases list.
- `directory-view.tsx`: the people and organisations tables with client-side search.
- `case-detail-page.tsx` and `directory-detail-page.tsx`: the record detail pages.
- `case-status.tsx`: status labels and the `nextStatus` transition map
  (`new -> in_progress -> waiting -> resolved -> closed`).
- `new-case-dialog.tsx`, `new-person-dialog.tsx`, `new-organisation-dialog.tsx`: create and edit
  forms built with React Hook Form and `zodResolver`.
- `record-dialog.tsx`: dialog shell built on `react-aria-components` `Modal` and `Dialog`, plus the
  shared `FormField`.
- `record-work.tsx`: the per-record work history with an activities timeline and a task ledger
  (add, complete, reopen).
- `record-row.tsx`: clickable table rows that navigate to the record page.
- `query-provider.tsx`: the TanStack Query client (15s `staleTime`, no refetch on window focus).

## Client data

Components fetch through `apiClient` inside TanStack Query hooks. Query keys follow the resource,
for example `['cases', search, status]`, `['case', id]`, and `['activities', subjectType,
subjectId]`. Mutations invalidate the affected keys after success. Lists are loaded once and
filtered client-side where practical; the cases and directory search queries re-fetch with a `q`
parameter using `useDeferredValue`.

## Forms

Forms use React Hook Form with `zodResolver` and the shared Zod contracts. The new case form
derives a local schema from `createCaseSchema` to make `nextActionAt`, `organisationId`, and
`personId` required in the UI, then maps back to the API shape on submit.

## i18n

`next-intl` is configured with a single `en` locale via [`src/i18n/request.ts`](../src/i18n/request.ts)
and [`messages/en.json`](../messages/en.json). Only page metadata is localised today; component
copy is hardcoded English.

## Styling

Tailwind CSS v4 with `@acid-info/logos-tokens/theme.css` and `@acid-info/logos-ui/styles.css`, plus
a large custom stylesheet in [`src/app/globals.css`](../src/app/globals.css). The display font is a
local Rhymes Display file loaded in [`src/app/fonts.ts`](../src/app/fonts.ts).
