# Media Calendar

The `/media/calendar` page lists live streams, updates and regular programming across the Logos network. It is a port of the calendar at https://blog.logos.co/calendar.

**Route:** [`apps/web/app/[locale]/media/calendar/page.tsx`](../app/[locale]/media/calendar/page.tsx) (`ROUTES.mediaCalendar`)
**Shared calendar:** [`apps/web/components/sections/events-calendar/`](../components/sections/events-calendar/events-calendar.tsx)
**Copy:** [`content/pages/en/media-calendar.json`](../../../content/pages/en/media-calendar.json)

The page is in the sitemap and linked from the Explore menu as `Calendar` (`content/site/en/navigation.json`).

---

## 1. Page structure

Two sections on an `accent-tan` background:

1. `MediaListingIntro`: the page heading and the `Logos Media` back link. The intro has no description on this page; `description` is optional on `MediaListingIntro`.
2. `EventsCalendar`: rendered with `details`, `syncMonthToUrl` and `compact`.

---

## 2. Shared `EventsCalendar`

The calendar used to live in `app/[locale]/logos-broadcast-network/_sections/`. It now lives in `components/sections/events-calendar/` so the Logos Broadcast Network page and the media calendar share it.

| File                    | Role                                                                          |
| ----------------------- | ----------------------------------------------------------------------------- |
| `events-calendar.tsx`   | Client component: month state, URL sync, hydration switch, layout             |
| `calendar-dates.ts`     | Date helpers: day grid, opening anchor, year options, `?year=&month=` parsing |
| `calendar-days.tsx`     | Desktop `CalendarCell` and mobile `MobileDayCarousel`                         |
| `calendar-controls.tsx` | `MonthSelect`, `YearSelect`, previous / today / next buttons                  |
| `event-details.tsx`     | Details panel for the selected day                                            |
| `types.ts`              | `EventsCalendarCopy`, `EventDetailsCopy`                                      |

```ts
interface EventsCalendarProps {
  events: BroadcastEventRow[]
  copy: EventsCalendarCopy
  referenceTime: number // build time in ms; stands in for "now" until hydration
  details?: EventDetailsCopy // enables day selection and the details panel
  syncMonthToUrl?: boolean // mirror the visible month in ?year=&month=
  compact?: boolean // drop the section's own vertical padding
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

The broadcast page passes no `details` and no `syncMonthToUrl`, so it looks and works as before: no details panel, and event pills open their links directly. The media calendar has no section heading; the page intro provides it.

---

## 3. Events data

Events come from `getBroadcastEvents()` in `apps/web/lib/blog-engine.ts`, fetched at build time like the broadcast page. New events appear after the next deploy.

`BroadcastEventRow` carries the detail fields the panel needs: `typeLabel`, `topic`, `guest`, `speakers` (array), `notes` and `links`. Placeholder values such as `null` or blank strings are dropped.

---

## 4. Opening position and day selection

The calendar opens on the month of the nearest upcoming event, with that day selected. When every event is in the past it opens on the most recent event; with no events it opens on today.

With `details` set:

- **Desktop:** every grid cell is a button with `aria-pressed`. Clicking selects the day. Pills become plain labels; their links move to the details panel.
- **Mobile:** every day in the carousel stays a button with `aria-pressed`, so tapping one keeps keyboard focus on it.

Changing month selects the preferred day if it is in that month (today, for the Today button), otherwise the first day with events, otherwise the first day of the month.

Day cells show one pill per event title. The details panel lists every event on the day, so two events with the same title both appear.

The year dropdown offers a year either side of today, every year with events, and the year on screen.

---

## 5. Details panel

Shown below the grid (desktop) or below the month controls (mobile), with `aria-live="polite"`.

- Heading: the selected date, e.g. `13 October 2026`.
- For each event, in time order: type pill, local time with UTC offset (e.g. `10:00 (UTC-7)`, `UTC+5:30`), topic, then `Guest`, `Speakers`, `Notes` and `Links` rows when present.
- A day without events shows the `empty` copy.

---

## 6. Timezone behaviour

The static HTML is rendered at build time, so the calendar first renders with build-time values: `referenceTime` as "now" and each event's `localDateKey` (the day on the build machine) for placement. This keeps the static HTML and the first client render identical.

After hydration (`useIsHydrated` in `apps/web/lib/use-is-hydrated.ts`) the calendar switches to the viewer's clock and timezone, so an event can move to a different day cell. The details panel only renders after hydration because it shows viewer-local times.

---

## 7. URL state

With `syncMonthToUrl`, the visible month is kept in `?year=&month=`, with a one-based month (`?year=2026&month=10` is October 2026).

- Changing month or year, or pressing previous / today / next, rewrites the query with `history.replaceState`. No history entry is added.
- On load, a valid query opens that month and selects its first day with events. The query is read after hydration.
- Invalid queries are ignored: missing or non-integer values, months outside `1`-`12`, years outside `1900`-`2100`.

---

## 8. Copy

Section `mediaCalendarCopy` / `mediaCalendar.copy` (`mediaCalendarCopySectionSchema` in `packages/content/src/schemas/pages/page-copy-sections.ts`):

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
