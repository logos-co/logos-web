# Logos CRM frontend

Reference for the UI of `apps/logos-crm`: the routes in [`src/app`](../src/app), the components in
[`src/components`](../src/components) and the API client in
[`src/lib/api-client.ts`](../src/lib/api-client.ts).

## Screens

| Route                 | Screen                                                                     |
| --------------------- | -------------------------------------------------------------------------- |
| `/`                   | Dashboard: open work, needs-attention list, pipeline                       |
| `/cases`              | Case queue with search, status filter and create dialog                    |
| `/cases/[id]`         | Case detail: next action, status progression, related people, work history |
| `/people`             | People directory with search and create dialog                             |
| `/people/[id]`        | Person detail with edit, contact details and work history                  |
| `/organisations`      | Organisations directory with search and create dialog                      |
| `/organisations/[id]` | Organisation detail with edit and work history                             |

There are no `/activities`, `/tasks`, `/reports`, `/imports` or `/settings` screens. Activities and
tasks only appear inside a record's work history.

## Components

`crm-shell.tsx` is the layout around every screen: the sidebar, primary navigation, skip link and
brand mark. It queries the dashboard, people and organisations endpoints to show counts next to the
nav links.

`crm-demo.tsx` backs the four list screens (`/`, `/cases`, `/people`, `/organisations`) and loads
their data. For `/cases` it renders the cases table (TanStack Table) with the search and status
filters and the new case dialog. `dashboard-view.tsx` draws the dashboard panels from the
`/api/v1/dashboard` summary and the cases list, and `directory-view.tsx` renders the people and
organisations tables.

The detail pages are `case-detail-page.tsx` and `directory-detail-page.tsx`. On a case,
`case-status.tsx` provides the status labels and the `nextStatus` map that moves a case one step
along `new -> in_progress -> waiting -> resolved -> closed`. Every record page includes
`record-work.tsx`, the work history with an activities timeline and a task list where you can add,
complete and reopen tasks.

The create and edit forms are `new-case-dialog.tsx`, `new-person-dialog.tsx` and
`new-organisation-dialog.tsx`. They sit in `record-dialog.tsx`, a dialog shell on
`react-aria-components` `Modal` and `Dialog` that also exports the shared `FormField`.

`record-row.tsx` makes a table row clickable, navigating to the record page and prefetching it on
hover. `query-provider.tsx` sets up the TanStack Query client with a 15 s `staleTime` and no refetch
on window focus.

## Client data

Components call `apiClient` inside TanStack Query hooks, with query keys named after the resource,
for example `['cases', search, status]`, `['case', id]` and `['activities', subjectType, subjectId]`.
After a successful mutation they invalidate the keys it affects.

Search goes to the server. The cases and directory search boxes pass their input through
`useDeferredValue` and re-fetch with a `q` parameter. With an empty search box, the people and
organisations directories show the full lists cached under the `['people']` and `['organisations']`
keys.

## Forms

Forms use React Hook Form with `zodResolver` and the shared Zod contracts. The new case form adapts
`createCaseSchema` for the UI: the organisation is required, the due date is a local date and time
string, and you can pick at most one person. On submit it converts these back to the API shape
(`organisation` name, ISO `nextActionAt`, `personIds` array).

## i18n

`next-intl` has a single `en` locale, configured in [`src/i18n/request.ts`](../src/i18n/request.ts)
with messages in [`messages/en.json`](../messages/en.json). Only the page metadata (title and
description) is translated today; component copy is hardcoded English.

## Styling

Styles come from Tailwind CSS v4 with `@acid-info/logos-tokens/theme.css` and
`@acid-info/logos-ui/styles.css`, plus a large custom stylesheet in
[`src/app/globals.css`](../src/app/globals.css). [`src/app/fonts.ts`](../src/app/fonts.ts) loads
the Rhymes Display font as a local file from `apps/web/public/fonts`.
