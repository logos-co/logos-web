import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { ActivistLeaderStewardCopySection } from '@repo/content/schemas'

import {
  AfformPageIntro,
  ConnectFormSection,
  ConnectPageLayout,
} from '@/components/sections/connect'
import { ROUTES } from '@/constants/routes'
import { env } from '@/lib/env'
import {
  AFFORM,
  AFFORM_NAME,
  AFFORM_OPTIONS,
} from '@/lib/civicrm/afform-activist-leader-steward'
import { createPageMetadata } from '@/lib/page-metadata'
import { createSectionFinder } from '@/lib/page-sections'

const ROUTE = ROUTES.activistLeaderSteward
const findSection = createSectionFinder('activist-leader-steward')

export const generateMetadata = createPageMetadata(ROUTE)

function getAfformSubmitApiUrl() {
  const base = env.NEXT_PUBLIC_CIVI_CRM_URL
  return base ? `${base.replace(/\/+$/, '')}/api/public/afform-submit` : ''
}

export default async function ActivistLeaderStewardPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(
      `ActivistLeaderStewardPage received non-active locale "${locale}"`
    )
  }

  const page = await getPageCopy(ROUTE, locale)
  const copy = findSection<ActivistLeaderStewardCopySection>(
    page.sections,
    'activistLeaderStewardCopy',
    'activistLeaderSteward.copy'
  )

  return (
    <ConnectPageLayout
      intro={
        copy.intro ? (
          <AfformPageIntro text={copy.intro} />
        ) : undefined
      }
    >
      <ConnectFormSection
        afform={AFFORM}
        afformOptions={AFFORM_OPTIONS}
        apiEndpoint={getAfformSubmitApiUrl()}
        pagePrivacy={copy.privacy}
        pagePrivacyLink={copy.privacyLink}
        extraPayload={{ formName: AFFORM_NAME }}
      />
    </ConnectPageLayout>
  )
}
