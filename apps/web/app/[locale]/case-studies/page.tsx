import { ROUTES } from '@/constants/routes'
import { createPageMetadata } from '@/lib/page-metadata'

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>
}) {
  const metadata = await createPageMetadata(ROUTES.caseStudies)(props)
  return { ...metadata, robots: { index: false, follow: true } }
}

export default function CaseStudiesPage() {
  return <div className="min-h-svh" />
}
