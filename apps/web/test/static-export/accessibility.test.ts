import { existsSync, readFileSync } from 'node:fs'
import { relative } from 'node:path'

import { criticalRoutes } from '../performance/budgets'
import { getAttribute, outDir, routeToHtmlFile, stripTags } from './helpers'

const assertAccessibility = (route: string, html: string): string[] => {
  const failures: string[] = []
  if (!/<html\b[^>]*\blang=["'][^"']+["']/i.test(html)) {
    failures.push(`${route} is missing html[lang]`)
  }
  if (!/<title>[^<]+<\/title>/i.test(html)) {
    failures.push(`${route} is missing a document title`)
  }
  if (!/<main\b/i.test(html)) {
    failures.push(`${route} is missing a main landmark`)
  }
  const h1Count = Array.from(html.matchAll(/<h1\b/gi)).length
  if (h1Count !== 1) {
    failures.push(`${route} expected exactly one h1, found ${h1Count}`)
  }

  for (const match of html.matchAll(/<img\b([^>]*)>/gi)) {
    const attributes = match[1] ?? ''
    if (getAttribute(attributes, 'alt') === null) {
      failures.push(`${route} has an image without alt text`)
    }
  }

  for (const match of html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attributes = match[1] ?? ''
    const body = match[2] ?? ''
    const label =
      getAttribute(attributes, 'aria-label') ??
      getAttribute(attributes, 'title') ??
      stripTags(body)
    const imageAlt = Array.from(body.matchAll(/<img\b([^>]*)>/gi))
      .map((imageMatch) => getAttribute(imageMatch[1] ?? '', 'alt') ?? '')
      .join(' ')
      .trim()
    if (!label && !imageAlt) {
      failures.push(`${route} has a link without accessible text`)
    }
  }

  return failures
}

const main = (): void => {
  if (!existsSync(outDir)) {
    throw new Error(
      'apps/web/out does not exist; run pnpm --filter web build first'
    )
  }

  const failures = criticalRoutes.flatMap((route) => {
    const htmlFile = routeToHtmlFile(route)
    if (!htmlFile) return [`${route} did not export an HTML file`]
    const html = readFileSync(htmlFile, 'utf8')
    return assertAccessibility(route, html).map(
      (failure) => `${failure} (${relative(outDir, htmlFile)})`
    )
  })

  if (failures.length > 0) {
    console.warn(
      `accessibility smoke found ${failures.length} issue(s):\n${failures.join('\n')}`
    )
    return
  }

  console.log('accessibility smoke passed')
}

main()
