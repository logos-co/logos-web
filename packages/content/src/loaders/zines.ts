import { assertActiveLocale } from '../locales/registry'
import type { Language } from '../schemas/common'
import {
  zineCatalogueSchema,
  zineArticleBodiesSchema,
  zineIssueSchema,
  type ZineCatalogue,
  type ZineIssue,
} from '../schemas/zines'
import { ContentNotFoundError, contentPath, readJson } from './_fs'

export const getZineCatalogue = async (
  locale: Language
): Promise<ZineCatalogue> => {
  assertActiveLocale(locale)
  const catalogue = await readJson(
    contentPath('zines', locale, 'catalogue.json'),
    zineCatalogueSchema
  )
  if (catalogue.language !== locale)
    throw new Error('Zine catalogue locale mismatch')
  return catalogue
}

export const getZineIssue = async (
  locale: Language,
  slug: string
): Promise<ZineIssue> => {
  const catalogue = await getZineCatalogue(locale)
  if (
    !catalogue.editions.some(
      (edition) => edition.slug === slug && edition.reader
    )
  ) {
    throw new ContentNotFoundError(`Zine "${slug}"`)
  }
  const issue = await readJson(
    contentPath('zines', locale, `${slug}.json`),
    zineIssueSchema
  )
  if (issue.slug !== slug || issue.language !== locale)
    throw new Error('Zine issue identity mismatch')
  return issue
}

export async function getZineArticleBodies(
  locale: Language,
  slug: string
): Promise<Record<string, string>> {
  const issue = await getZineIssue(locale, slug)
  const bodies = await readJson(
    contentPath('zines', locale, `${slug}-articles.json`),
    zineArticleBodiesSchema
  )
  if ((issue.articles ?? []).some((article) => !bodies[article.slug]))
    throw new Error('Missing zine article text')
  return bodies
}
