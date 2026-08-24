import { getPageCopy } from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import type { ActivistLeaderStewardCopySection } from '@repo/content/schemas'
import { REQUIRED_FIELDS_BY_FORM } from '@repo/funnel'

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
} from '@/lib/funnel-forms/afform-activist-leader-steward'
import { withHearAboutField } from '@/lib/funnel-forms/hear-about-field'
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
        afform={withHearAboutField(AFFORM)}
        afformOptions={AFFORM_OPTIONS}
        requiredFields={REQUIRED_FIELDS_BY_FORM[AFFORM_NAME]}
        apiEndpoint={getAfformSubmitApiUrl()}
        pagePrivacy={copy.privacy}
        pagePrivacyLink={copy.privacyLink}
        extraPayload={{ formName: AFFORM_NAME }}
      />
    </ConnectPageLayout>
  )
}
