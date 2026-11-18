import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { getZineCatalogue, getZineIssue } from '@repo/content/loaders'
import { getActiveLocales } from '@repo/content/locales'
import { zineDocumentSchema } from '@repo/content/schemas'
import { ZINE_PAGE_FILES, zineCacheKey } from '../asset-cache'

const web = resolve(__dirname, '../../..')
const regenerate =
  'Run `pnpm --filter web generate:zines` and commit apps/web/public/zines/generated/.'

describe('committed zine assets', async () => {
  const locale = getActiveLocales()[0]
  const catalogue = await getZineCatalogue(locale)
  const issues = await Promise.all(
    catalogue.editions
      .filter((edition) => edition.reader)
      .map((edition) => getZineIssue(locale, edition.slug))
  )

  it.each(issues.map((issue) => [issue.slug, issue] as const))(
    '%s matches its PDF, text layer and generator version',
    (slug, issue) => {
      const output = resolve(web, 'public/zines/generated', slug)
      const documentPath = resolve(output, 'document.json')
      expect(
        existsSync(documentPath),
        `${slug} is missing. ${regenerate}`
      ).toBe(true)
      const stored = zineDocumentSchema.safeParse(
        JSON.parse(readFileSync(documentPath, 'utf8'))
      )
      expect(
        stored.success,
        `${slug} document.json is outdated. ${regenerate}`
      ).toBe(true)
      const textLayer = issue.textLayer
        ? readFileSync(
            resolve(web, 'scripts/zines/text-layers', `${slug}.json`),
            'utf8'
          )
        : null
      const key = zineCacheKey(
        readFileSync(resolve(web, 'public', issue.pdf.slice(1))),
        textLayer
      )
      expect(
        stored.data?.cacheKey,
        `${slug} pages are stale. ${regenerate}`
      ).toBe(key)
      const missing = (stored.data?.pages ?? [])
        .flatMap((page) => ZINE_PAGE_FILES(page.number))
        .filter((file) => !existsSync(resolve(output, file)))
      expect(missing, `${slug} is missing page files. ${regenerate}`).toEqual(
        []
      )
    }
  )
})
