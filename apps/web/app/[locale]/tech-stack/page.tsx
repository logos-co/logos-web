import { ROUTES } from '@/constants/routes'
import { createRedirectMetadata, StaticRedirect } from '@/lib/static-redirect'

const TARGET = ROUTES.technologyStack

export const generateMetadata = createRedirectMetadata(TARGET)

export default async function TechStackRedirectPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  return <StaticRedirect target={TARGET} locale={locale} />
}
