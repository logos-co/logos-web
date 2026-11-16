import { cache } from 'react'
import { getTranslations } from 'next-intl/server'
import type { Language } from '@repo/content/schemas'

import { loadLambdaProgramme } from '@/lib/lambda-programme'
import { loadRfpProgramme } from '@/lib/rfp-programme'

export const loadProgrammeCards = cache(async (locale: Language) => {
  const [rfp, lambda, t] = await Promise.all([
    loadRfpProgramme(locale),
    loadLambdaProgramme(locale),
    getTranslations({ locale, namespace: 'programmeData' }),
  ])

  return {
    prize: lambda.recommended,
    rfps: rfp.items
      .filter(({ status }) => status === 'open')
      .slice(0, 4)
      .map((item) => {
        const presentation = rfp.copy.listing.featured.find(
          ({ id }) => id === item.number
        )
        return {
          number: item.number,
          slug: item.slug,
          title: item.title,
          summary: presentation?.body ?? item.summary,
          image: presentation?.image,
        }
      }),
    rfpLinkLabel: rfp.copy.listing.learnMore,
    noOpenRfps: t('noOpenRfps'),
  }
})

export type ProgrammeCards = Awaited<ReturnType<typeof loadProgrammeCards>>
