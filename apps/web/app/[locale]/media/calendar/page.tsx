import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { MediaCalendarCopySection } from '@repo/content/schemas'

import { MediaEventsCalendar } from '@/components/sections/events-calendar/media-events-calendar'
import { MediaListingIntro } from '@/components/sections/media/media-listing-intro'
import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.mediaCalendar

const findSection = createSectionFinder('media-calendar')

export const generateMetadata = createPageMetadata(ROUTE)

export default async function MediaCalendarPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`MediaCalendarPage received non-active locale "${locale}"`)
  }

  const page = await getPageCopy(ROUTE, locale)

  const data = findSection<MediaCalendarCopySection>(
    page.sections,
    'mediaCalendarCopy',
    'mediaCalendar.copy'
  )

  return (
    <div className="overflow-hidden bg-accent-tan pb-10">
      <MediaListingIntro
        copy={{
          title: data.heading,
          backToMedia: data.backToMedia,
        }}
      />
      <MediaEventsCalendar
        referenceTime={Date.now()}
        copy={data.calendar}
        details={data.details}
      />
    </div>
  )
}
