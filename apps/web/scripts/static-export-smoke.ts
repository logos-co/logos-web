import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { getAllIdeas, getAllRfps, getCircles } from '@repo/content/loaders'

import { ROUTES } from '../constants/routes'
import { ROUTE_AVAILABILITY } from '../constants/route-availability'

const webRoot = process.cwd()
const outDir = join(webRoot, 'out')
const locale = 'en'

const staticRoutes = [
  ROUTES.home,
  ROUTES.technologyStack,
  ROUTES.blockchain,
  ROUTES.networking,
  ROUTES.messaging,
  ROUTES.storage,
  ROUTES.buildersHub,
  ROUTES.ideas,
  ROUTES.rfps,
  ROUTES.circles,
] as const

const toRoutePath = (route: string): string => {
  const normalized = route === '/' ? '' : route.replace(/^\/+/, '')
  return normalized
}

const findHtmlFile = (route: string): string | null => {
  const routePath = toRoutePath(route)
  const candidates =
    routePath === ''
      ? [join(outDir, 'index.html')]
      : [
          join(outDir, routePath, 'index.html'),
          join(outDir, `${routePath}.html`),
        ]

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

const collectHtmlFiles = (dir: string): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return collectHtmlFiles(path)
    return path.endsWith('.html') ? [path] : []
  })
}

const htmlFileToRoute = (filePath: string): string => {
  const relativePath = relative(outDir, filePath)
  if (relativePath === 'index.html') return '/'
  if (relativePath.endsWith('/index.html')) {
    return `/${relativePath.replace(/\/index\.html$/, '')}`
  }
  return `/${relativePath.replace(/\.html$/, '')}`
}

const collectExpectedRoutes = async (): Promise<string[]> => {
  const [rfps, ideas, circles] = await Promise.all([
    getAllRfps({ locale, status: 'published' }),
    getAllIdeas({ locale, status: 'published' }),
    getCircles({ locale, status: 'published' }),
  ])

  return [
    ...staticRoutes,
    ...rfps.map((rfp) => `${ROUTES.rfps}/${rfp.slug}`),
    ...ideas.map((idea) => `${ROUTES.ideas}/${idea.slug}`),
    ...(ROUTE_AVAILABILITY.circleDetailLinks
      ? circles.map((circle) => ROUTES.circle(circle.slug))
      : []),
  ].sort((a, b) => a.localeCompare(b))
}

const toCanonicalUrl = (route: string): string => {
  return route === '/' ? 'https://logos.co/' : `https://logos.co${route}`
}

const assertSeoFiles = (expectedRoutes: readonly string[]): string[] => {
  const failures: string[] = []
  const robotsPath = join(outDir, 'robots.txt')
  const sitemapPath = join(outDir, 'sitemap.xml')

  if (!existsSync(robotsPath)) {
    failures.push('robots.txt is missing from the static export root')
  } else {
    const robots = readFileSync(robotsPath, 'utf8')
    if (!robots.includes('Sitemap: https://logos.co/sitemap.xml')) {
      failures.push('robots.txt is missing the production sitemap URL')
    }
  }

  if (!existsSync(sitemapPath)) {
    failures.push('sitemap.xml is missing from the static export root')
  } else {
    const sitemap = readFileSync(sitemapPath, 'utf8')
    for (const route of expectedRoutes) {
      const loc = `<loc>${toCanonicalUrl(route)}</loc>`
      if (!sitemap.includes(loc)) {
        failures.push(`sitemap.xml is missing ${toCanonicalUrl(route)}`)
      }
    }
  }

  return failures
}

const isLocalAssetHref = (href: string): boolean => {
  if (!href.startsWith('/')) return false
  if (href.startsWith('//')) return false
  if (href.startsWith('/#')) return false
  return /\.(avif|css|gif|ico|jpeg|jpg|js|json|png|svg|txt|webp|woff2?|xml)$/i.test(
    href.split(/[?#]/, 1)[0] ?? ''
  )
}

const assertHtmlPage = (route: string, filePath: string): string[] => {
  const html = readFileSync(filePath, 'utf8')
  const failures: string[] = []
  if (html.length < 500) {
    failures.push(`${route} exported HTML is unexpectedly small`)
  }
  if (!html.includes('</html>')) {
    failures.push(`${route} exported HTML is missing closing </html>`)
  }
  if (html.includes(`href="/${locale}/`) || html.includes(`src="/${locale}/`)) {
    failures.push(`${route} still contains default-locale-prefixed asset paths`)
  }

  const refs = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)
  for (const [, rawHref] of refs) {
    if (!rawHref || !isLocalAssetHref(rawHref)) continue
    const assetPath = rawHref.split(/[?#]/, 1)[0]!
    const absolutePath = join(outDir, assetPath.replace(/^\/+/, ''))
    if (!existsSync(absolutePath) || !statSync(absolutePath).isFile()) {
      failures.push(
        `${route} references missing asset ${assetPath} from ${relative(
          outDir,
          filePath
        )}`
      )
    }
  }

  return failures
}

const main = async (): Promise<void> => {
  if (!existsSync(outDir)) {
    throw new Error(
      'apps/web/out does not exist; run pnpm --filter web build first'
    )
  }
  if (existsSync(join(outDir, locale))) {
    throw new Error(
      `apps/web/out/${locale} still exists after locale stripping`
    )
  }

  const failures: string[] = []
  const checkedHtmlFiles = new Set<string>()
  const expectedRoutes = await collectExpectedRoutes()
  failures.push(...assertSeoFiles(expectedRoutes))

  for (const route of expectedRoutes) {
    const htmlFile = findHtmlFile(route)
    if (!htmlFile) {
      failures.push(`${route} did not export an HTML file`)
      continue
    }
    checkedHtmlFiles.add(htmlFile)
    failures.push(...assertHtmlPage(route, htmlFile))
  }

  for (const htmlFile of collectHtmlFiles(outDir)) {
    if (checkedHtmlFiles.has(htmlFile)) continue
    failures.push(...assertHtmlPage(htmlFileToRoute(htmlFile), htmlFile))
  }

  if (failures.length > 0) {
    throw new Error(`static export smoke failed:\n${failures.join('\n')}`)
  }

  console.log('static export smoke passed')
}

await main()
