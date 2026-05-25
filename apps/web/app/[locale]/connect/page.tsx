import {
  ConnectFormSection,
  ConnectPageLayout,
} from '@/components/sections/connect'
import { ROUTES } from '@/constants/routes'
import { env } from '@/lib/env'
import {
  AFFORM,
  AFFORM_OPTIONS,
  AFFORM_PAGE_HEADING,
  AFFORM_PAGE_INTRO,
  AFFORM_PAGE_PRIVACY,
  AFFORM_PAGE_PRIVACY_LINK,
} from '@/lib/civicrm/afform-circle-contact-form'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.connect'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.connect,
})

function getContactApiUrl() {
  const base = env.NEXT_PUBLIC_CIVI_CRM_URL
  return base ? `${base.replace(/\/+$/, '')}/api/public/contact` : ''
}

export default function ConnectPage() {
  return (
    <ConnectPageLayout
      heading={AFFORM_PAGE_HEADING || "Let's Connect."}
      intro={AFFORM_PAGE_INTRO}
    >
      <ConnectFormSection
        afform={AFFORM}
        afformOptions={AFFORM_OPTIONS}
        apiEndpoint={getContactApiUrl()}
        pagePrivacy={AFFORM_PAGE_PRIVACY}
        pagePrivacyLink={AFFORM_PAGE_PRIVACY_LINK}
      />
    </ConnectPageLayout>
  )
}
