import { notFound } from 'next/navigation'
import {
  ContentNotFoundError,
  getZineCatalogue,
  getZineIssue,
} from '@repo/content/loaders'
import { isActiveLocale } from '@repo/content/locales'
import { ZineReader } from '@/components/sections/zines/zine-reader'
import { ROUTES } from '@/constants/routes'
import { routing } from '@/i18n/routing'
import { createDefaultMetadata } from '@/lib/metadata'

interface PageProps {
  params: Promise<{ locale: string; slug: string }>
}
export const dynamicParams = false

export async function generateStaticParams() {
  const params: Array<{ locale: string; slug: string }> = []
  for (const locale of routing.locales) {
    const catalogue = await getZineCatalogue(locale)
    params.push(
      ...catalogue.editions
        .filter((edition) => edition.reader)
        .map((edition) => ({ locale, slug: edition.slug }))
    )
  }
  return params
}

async function readIssue(params: PageProps['params']) {
  const { locale, slug } = await params
  if (!isActiveLocale(locale)) throw new Error(`Inactive locale: ${locale}`)
  try {
    return { locale, issue: await getZineIssue(locale, slug) }
  } catch (error) {
    if (error instanceof ContentNotFoundError) notFound()
    throw error
  }
}

export async function generateMetadata({ params }: PageProps) {
  const { locale, issue } = await readIssue(params)
  return createDefaultMetadata({
    title: issue.title,
    description: issue.description,
    locale,
    path: ROUTES.zine(issue.slug),
  })
}

export default async function ZineIssuePage({ params }: PageProps) {
  const { issue } = await readIssue(params)
  return <ZineReader issue={issue} />
}
