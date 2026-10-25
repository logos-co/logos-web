# Media Calendar

The `/media/calendar` page lists live streams, updates and regular programming across the Logos network, a port of the calendar at https://blog.logos.co/calendar. The page is [`app/[locale]/media/calendar/page.tsx`](../app/[locale]/media/calendar/page.tsx) (`ROUTES.mediaCalendar`); the calendar itself lives in [`components/sections/events-calendar/`](../components/sections/events-calendar/events-calendar.tsx) and is shared with the Logos Broadcast Network page; the copy comes from [`content/pages/en/media-calendar.json`](../../../content/pages/en/media-calendar.json). The page appears in [`app/sitemap.ts`](../app/sitemap.ts) and in the Explore menu as `Calendar` (`content/site/en/navigation.json`).

## Page structure

The page renders two sections on an `accent-tan` background. `MediaListingIntro` renders the page heading and the `Logos Media` back link; `description` is optional on it and this page leaves it out. `EventsCalendar` renders with `details`, `syncMonthToUrl` and `compact`.

## Shared calendar

The calendar used to sit in `app/[locale]/logos-broadcast-network/_sections/`. It moved to `components/sections/events-calendar/` so the broadcast page and the media calendar can share it.

| File                    | Role                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| `events-calendar.tsx`   | Client component: month state, URL sync, hydration switch, layout              |
| `calendar-dates.ts`     | Date helpers: day grid, opening anchor, year options, `?year=&month=` parsing |
| `calendar-days.tsx`     | Desktop `CalendarCell` and mobile `MobileDayCarousel`                         |
| `calendar-controls.tsx` | `MonthSelect`, `YearSelect`, previous / today / next buttons                  |
| `event-details.tsx`     | Details panel for the selected day                                            |
| `types.ts`              | `EventsCalendarCopy`, `EventDetailsCopy`                                      |

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

Events are loaded in the browser by `LiveBroadcastEvents`, using the public `https://admin-acid.logos.co/api/calendar/public` endpoint. `lib/broadcast-events.ts` requests uncached data and `@repo/content/calendar` validates and maps the response. Neither the media calendar nor the Broadcast Network event cards fetch events during the static build, so admin changes do not require a website deployment.

The shared React Query cache refreshes on each mount, every minute while the page is visible, and on focus or reconnect when stale (after one minute). Each response replaces the complete list, including edits and deletions. The Broadcast Network cards and calendar use the same response. Loading and request failures have translated status messages and a retry button; an error is never shown as an empty schedule. A successful empty list still displays the calendar.

`BroadcastEventRow` carries `typeLabel`, `topic`, `guest`, `speakers`, `notes` and `links`. Placeholder values such as `null` or blank strings are dropped. The API must allow the website origin through CORS, including any preview or local development origin used for verification.

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

The static HTML contains the loading state. Events are fetched after hydration and placed using the viewer's timezone. The shared calendar retains its hydration guard for date and URL handling, and the details panel shows viewer-local times.

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
