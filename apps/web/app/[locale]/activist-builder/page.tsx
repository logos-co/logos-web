import {
  ConnectFormSection,
  ConnectPageLayout,
} from '@/components/sections/connect'
import { ROUTES } from '@/constants/routes'
import { env } from '@/lib/env'
import {
  AFFORM,
  AFFORM_NAME,
  AFFORM_OPTIONS,
  AFFORM_PAGE_INTRO,
  AFFORM_PAGE_PRIVACY,
  AFFORM_PAGE_PRIVACY_LINK,
} from '@/lib/civicrm/afform-activist-builder'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.activistBuilder'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.activistBuilder,
})

function getAfformSubmitApiUrl() {
  const base = env.NEXT_PUBLIC_CIVI_CRM_URL
  return base ? `${base.replace(/\/+$/, '')}/api/public/afform-submit` : ''
}

export default function ActivistBuilderPage() {
  return (
    <ConnectPageLayout intro={AFFORM_PAGE_INTRO || undefined}>
      <ConnectFormSection
        afform={AFFORM}
        afformOptions={AFFORM_OPTIONS}
        apiEndpoint={getAfformSubmitApiUrl()}
        pagePrivacy={AFFORM_PAGE_PRIVACY}
        pagePrivacyLink={AFFORM_PAGE_PRIVACY_LINK}
        extraPayload={{ formName: AFFORM_NAME }}
      />
    </ConnectPageLayout>
  )
}
