# Media Calendar

The `/media/calendar` page lists live streams, updates and regular programming across the Logos network, a port of the calendar at https://blog.logos.co/calendar. The page is [`app/[locale]/media/calendar/page.tsx`](../app/[locale]/media/calendar/page.tsx) (`ROUTES.mediaCalendar`); the calendar itself lives in [`components/sections/events-calendar/`](../components/sections/events-calendar/events-calendar.tsx) and is shared with the Logos Broadcast Network page; the copy comes from [`content/pages/en/media-calendar.json`](../../../content/pages/en/media-calendar.json). The page appears in [`app/sitemap.ts`](../app/sitemap.ts) and in the Explore menu as `Calendar` (`content/site/en/navigation.json`).

## Page structure

The page renders two sections on an `accent-tan` background. `MediaListingIntro` renders the page heading and the `Logos Media` back link; `description` is optional on it and this page leaves it out. The server page reads `getBroadcastEvents()` from the build snapshot and passes the events, `copy`, `details` and `referenceTime` to `MediaEventsCalendar`, which renders `EventsCalendar` with `syncMonthToUrl` and `compact`.

## Shared calendar

The calendar used to sit in `app/[locale]/logos-broadcast-network/_sections/`. It moved to `components/sections/events-calendar/` so the broadcast page and the media calendar can share it.

| File                        | Role                                                                          |
| --------------------------- | ----------------------------------------------------------------------------- |
| `events-calendar.tsx`       | Client component: month state, URL sync, hydration switch, layout             |
| `media-events-calendar.tsx` | Media page wrapper passing build-time events to `EventsCalendar`              |
| `calendar-dates.ts`         | Date helpers: day grid, opening anchor, year options, `?year=&month=` parsing |
| `calendar-days.tsx`         | Desktop `CalendarCell` and mobile `MobileDayCarousel`                         |
| `calendar-controls.tsx`     | `MonthSelect`, `YearSelect`, previous / today / next buttons                  |
| `event-details.tsx`         | Details panel for the selected day                                            |
| `types.ts`                  | `EventsCalendarCopy`, `EventDetailsCopy`                                      |

```ts
interface EventsCalendarProps {
  events: BroadcastEventRow[]
  copy: EventsCalendarCopy
  /** Build time in ms; stands in for "now" until hydration. */
  referenceTime: number
  /** Enables day selection and the details panel. */
  details?: EventDetailsCopy
  /** Mirror the visible month in `?year=&month=`. */
  syncMonthToUrl?: boolean
  /** Drop the section's own vertical padding. */
  compact?: boolean
}

interface EventsCalendarCopy {
  heading?: string
  yearLabel: string
  monthLabel: string
  todayLabel: string
}

interface EventDetailsCopy {
  empty: string
  guest: string
  speakers: string
  notes: string
  links: string
}
```

The broadcast page passes neither `details` nor `syncMonthToUrl`, so it behaves as before: no details panel, and event pills open their links directly. The media calendar has no section heading; the page intro provides it.

## Events data

[`scripts/sync-broadcast-events.ts`](../scripts/sync-broadcast-events.ts) runs during `build:assets`, and you can run it alone with `pnpm --filter web sync:broadcast-events`. It reads `<origin>/calendar/public`, with the origin from the server-only `ADMIN_ACID_API_URL` (through [`lib/env.ts`](../lib/env.ts)), defaulting to `https://admin-acid.logos.co/api`. `ADMIN_ACID_API_AUTHORIZATION` optionally supplies an Authorization header, which the upstream proxy must accept; neither variable reaches the browser. Upstream build access still needs configuration; arrange it with the infrastructure team. Requests bypass the cache, time out after ten seconds and validate the complete response with the shared `@repo/content/calendar` schema.

The sync strips fields the calendar does not use and atomically writes [`lib/data/broadcast-events.snapshot.json`](../lib/data/broadcast-events.snapshot.json), including its `generatedAt` capture time. A successful empty response replaces the snapshot with an empty list, so removed events do not return. Failed requests or invalid responses fail the build and leave the existing deployed site intact. During an outage, `ALLOW_CONTENT_FETCH_FAILURE=1` or the calendar-only `ALLOW_BROADCAST_EVENTS_FETCH_FAILURE=1` permits the build to validate and reuse the committed snapshot; the release test workflow sets the calendar-only switch. Commit refreshed snapshots periodically so a clean checkout has a recent fallback. The initial snapshot contains 49 events, the latest on 11 November 2025, captured from the public-feed route in an authenticated administrator session while anonymous requests were blocked by OAuth2 Proxy.

Both server pages call [`lib/broadcast-events.ts`](../lib/broadcast-events.ts) during the static export and pass the captured events to their client components. Browsers never call admin-acid for calendar events and do not poll or retry. CORS and backend availability cannot affect an already deployed calendar. Event additions, edits and deletions appear after the next successful build and deployment. `BroadcastEventRow` carries `typeLabel`, `topic`, `guest`, `speakers`, `notes` and `links`; placeholder values such as `null` or blank strings are dropped.

### Reviewed snapshots

Set `BROADCAST_EVENTS_SNAPSHOT` to an existing snapshot file to reuse it without a live request or a new capture time. The file must contain a valid calendar response and an ISO `generatedAt` timestamp; a missing or invalid reviewed snapshot fails the build rather than silently using different live data. The Site publish workflow and Jenkins capture calendar events for staging and archive them alongside the press snapshot. Both jobs enable the calendar-only fallback so releases can use the committed calendar while upstream build access is unavailable. Production promotion restores both reviewed snapshots, so the published calendar matches the staging review even if events changed meanwhile.

### Event change trigger

The [Site publish workflow](../../../.github/workflows/site-publish.yml) accepts an authenticated GitHub `repository_dispatch` with `event_type: "calendar-updated"`. It always rebuilds staging from `develop`, even if the payload requests production. The existing reviewed-preview promotion is still required for production.

The sender in admin-acid must dispatch this event after a successful event create, edit, delete or CSV import. That backend hook and its GitHub App credentials are an external integration requirement and are not configured yet; this web repository implements only the receiver. The browser sends no change notifications. For example, the trusted backend can POST the following body to `https://api.github.com/repos/logos-co/logos-web/dispatches` with a repository-scoped GitHub App token:

```json
{ "event_type": "calendar-updated" }
```

This trigger starts a new capture, which reads the `ADMIN_ACID_API_URL` repository variable and the `ADMIN_ACID_API_AUTHORIZATION` secret, so keep the upstream read credentials available to the build runner. If the upstream is unavailable, the configured calendar fallback reuses the committed schedule. A missing or invalid snapshot still fails the run and leaves the prior deployment in place.

## Opening position and selection

The calendar opens on the month of the nearest upcoming event, with that day selected. When every event is in the past it opens on the most recent event; with no events it opens on today.

With `details` set, every desktop grid cell is a button with `aria-pressed` and clicking one selects the day. Pills become plain labels and their links move to the details panel. On mobile every day in the carousel stays a button with `aria-pressed`, so tapping one keeps keyboard focus on it.

Changing month selects the preferred day when one is given and falls in that month (the Today button passes today), otherwise the first day with events, otherwise the first day of the month.

Day cells show one pill per event title. The details panel lists every event on the day, so two events with the same title both appear.

The year dropdown offers a year either side of today, every year with events, and the year on screen.

## Details panel

The panel renders below the grid on desktop and below the month controls on mobile, with `aria-live="polite"`.

The heading is the selected date, for example `13 October 2026`. Each event, in time order, shows a type pill, the local time with its UTC offset (`10:00 (UTC-7)`, `UTC+5:30`), the topic, then `Guest`, `Speakers`, `Notes` and `Links` rows when present. The time is left out for an event with no start time. A day without events shows the `empty` copy.

## Timezone behaviour

The static HTML contains saved events placed on their UTC dates. The first client render uses the same dates to avoid a hydration mismatch, then the shared calendar places them in the viewer's timezone. The details panel shows viewer-local times.

## URL state

With `syncMonthToUrl`, the visible month is kept in `?year=&month=`, with a one-based month: `?year=2026&month=10` is October 2026.

Changing month or year, or pressing previous, today or next, rewrites the query with `history.replaceState`. No history entry is added. On load, a valid query opens that month and selects its first day with events, read after hydration. Invalid queries are ignored: missing or non-integer values, months outside `1`-`12`, years outside `1900`-`2100`.

## Copy

Section `mediaCalendarCopy` / `mediaCalendar.copy`, from `mediaCalendarCopySectionSchema` in [`packages/content/src/schemas/pages/page-copy-sections.ts`](../../../packages/content/src/schemas/pages/page-copy-sections.ts):

```ts
interface MediaCalendarCopySection {
  componentType: 'mediaCalendarCopy'
  key: string
  heading: string
  backToMedia: string
  calendar: { yearLabel: string; monthLabel: string; todayLabel: string }
  details: {
    empty: string
    guest: string
    speakers: string
    notes: string
    links: string
  }
}
```
