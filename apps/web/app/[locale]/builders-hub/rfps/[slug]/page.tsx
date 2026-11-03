import { ROUTES } from '@/constants/routes'
import { resolveLocale, type LocaleSlugParams } from '@/lib/route-params'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

export { generateStaticParams } from '../../../rfp/[slug]/page'

export async function generateMetadata({ params }: LocaleSlugParams) {
  const { slug } = await params
  return createRedirectMetadata(`${ROUTES.rfps}/${slug}`)({ params })
}

export default async function RfpRedirectPage({ params }: LocaleSlugParams) {
  const locale = await resolveLocale(params, 'RfpRedirectPage')
  const { slug } = await params
  return (
    <StaticRedirect
      target={`${ROUTES.rfps}/${slug}`}
      locale={locale}
      preserveSearchAndHash
    />
  )
}
