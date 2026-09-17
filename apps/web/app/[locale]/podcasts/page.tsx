import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.mediaPodcastsSection

export const generateMetadata = createRedirectMetadata(TARGET)

export default async function LegacyPodcastsPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <StaticRedirect target={TARGET} locale={locale} />
}
