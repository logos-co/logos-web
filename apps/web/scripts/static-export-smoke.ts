import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { getAllIdeas, getCircles } from '@repo/content/loaders'

import { ROUTES } from '../constants/routes'
import { ROUTE_AVAILABILITY } from '../constants/route-availability'
import { env } from '../lib/env'
import { MEDIA_IMAGE_DIR } from '../lib/media-images'
import {
  MEDIA_SEARCH_INDEX_FILE,
  type MediaSearchIndex,
} from '../lib/media-search'

/**
 * robots.txt is deliberately different per environment, so the assertions have
 * to follow the same switch `app/robots.ts` uses. Only the production deploy
 * invites crawlers and advertises a sitemap; every other build closes itself
 * off so staging never competes with logos.co.
 */
const isProductionBuild = env.NEXT_PUBLIC_API_MODE === 'production'

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

/**
 * RFP detail slugs come from the live Github listing, so they are only knowable
 * from what this build actually exported. Reading them back out of `out/` keeps
 * the sitemap assertion comparing the export against itself, instead of racing a
 * second Github fetch against the one the build already made.
 */
const collectExportedRfpDetailRoutes = (): string[] => {
  const rfpsDir = join(outDir, toRoutePath(ROUTES.rfps))
  if (!existsSync(rfpsDir)) return []
  return collectHtmlFiles(rfpsDir)
    .map(htmlFileToRoute)
    .filter((route) => route !== ROUTES.rfps)
}

const collectExpectedRoutes = async (): Promise<string[]> => {
  const [ideas, circles] = await Promise.all([
    getAllIdeas({ locale, status: 'published' }),
    getCircles({ locale, status: 'published' }),
  ])

  const routes = [
    ...staticRoutes,
    ...collectExportedRfpDetailRoutes(),
    ...ideas.map((idea) => `${ROUTES.ideas}/${idea.slug}`),
    ...(ROUTE_AVAILABILITY.circleDetailLinks
      ? circles.map((circle) => ROUTES.circle(circle.slug))
      : []),
  ]

  return [...new Set(routes)].sort((a, b) => a.localeCompare(b))
}

const SITE_ORIGIN = 'https://logos.co'

const toCanonicalUrl = (route: string): string => {
  return route === '/' ? `${SITE_ORIGIN}/` : `${SITE_ORIGIN}${route}`
}

const assertSeoFiles = (expectedRoutes: readonly string[]): string[] => {
  const failures: string[] = []
  const robotsPath = join(outDir, 'robots.txt')
  const sitemapPath = join(outDir, 'sitemap.xml')
  // rss/hashing-it-out.xml is optional: the show has no episodes in the CMS and
  // blog.logos.co never served a real feed there, so the generator skips it.
  const feedPaths = [
    'rss/main.xml',
    'rss/logos-state.xml',
    'rss.xml',
    'atom.xml',
    'atom_page2.xml',
  ]

  for (const feedPath of feedPaths) {
    if (!existsSync(join(outDir, feedPath))) {
      failures.push(`${feedPath} is missing from the static export`)
    }
  }

  if (!existsSync(robotsPath)) {
    failures.push('robots.txt is missing from the static export root')
  } else {
    const robots = readFileSync(robotsPath, 'utf8')
    if (isProductionBuild) {
      if (!robots.includes('Allow: /')) {
        failures.push(
          'robots.txt does not allow crawling in a production build'
        )
      }
      if (!robots.includes(`Sitemap: ${SITE_ORIGIN}/sitemap.xml`)) {
        failures.push('robots.txt is missing the production sitemap URL')
      }
    } else {
      if (!robots.includes('Disallow: /')) {
        failures.push(
          'robots.txt should disallow crawling outside a production build'
        )
      }
      if (robots.includes('Sitemap:')) {
        failures.push(
          'robots.txt should not advertise a sitemap outside a production build'
        )
      }
    }
  }

  if (!existsSync(sitemapPath)) {
    failures.push('sitemap.xml is missing from the static export root')
  } else {
    const sitemap = readFileSync(sitemapPath, 'utf8')
    const sitemapEntries = [
      ...sitemap.matchAll(/<url>\s*<loc>([^<]+)<\/loc>([\s\S]*?)<\/url>/g),
    ].map(([, loc = '', body = '']) => ({
      loc,
      hasLastmod: body.includes('<lastmod>'),
    }))
    const isMediaDetailUrl = (loc: string) =>
      /^https:\/\/logos\.co\/media\/(?:article|podcasts)\//.test(loc)
    // Only media detail pages carry a content-derived modified date.
    if (
      sitemapEntries.some(
        (entry) => entry.hasLastmod && !isMediaDetailUrl(entry.loc)
      )
    ) {
      failures.push('sitemap.xml contains unverified lastmod values')
    }
    for (const route of expectedRoutes) {
      const loc = `<loc>${toCanonicalUrl(route)}</loc>`
      if (!sitemap.includes(loc)) {
        failures.push(`sitemap.xml is missing ${toCanonicalUrl(route)}`)
      }
    }
    failures.push(...findSitemapUrlsWithoutPages(sitemap))
    const mediaDetailEntries = sitemapEntries.filter((entry) =>
      isMediaDetailUrl(entry.loc)
    )
    if (
      mediaDetailEntries.length === 0 ||
      mediaDetailEntries.some((entry) => !entry.hasLastmod)
    ) {
      failures.push(
        'sitemap.xml media detail entries must use content-derived lastmod values'
      )
    }
  }

  return failures
}

/**
 * The loop above only proves every page we expected reached the sitemap. It
 * cannot catch the opposite failure: a `<loc>` the export never wrote an HTML
 * file for, which would send crawlers to a 404. RFP detail routes are the real
 * risk, since the sitemap and the pages each resolve them from the live Github
 * listing.
 *
 * This reads the sitemap back against `out/` and needs no second Github fetch.
 */
const findSitemapUrlsWithoutPages = (sitemap: string): string[] => {
  const locs = [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(
    (match) => match[1]!
  )

  return locs.flatMap((loc) => {
    const route = loc.replace(SITE_ORIGIN, '') || '/'
    if (findHtmlFile(route)) return []
    return [`sitemap.xml lists ${loc} but the export has no page for it`]
  })
}

const isLocalAssetHref = (href: string): boolean => {
  if (!href.startsWith('/')) return false
  if (href.startsWith('//')) return false
  if (href.startsWith('/#')) return false
  return /\.(avif|css|gif|ico|jpeg|jpg|js|json|png|svg|txt|webp|woff2?|xml)$/i.test(
    href.split(/[?#]/, 1)[0] ?? ''
  )
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const breadcrumbTechRoutes = new Set<string>([
  ROUTES.blockchain,
  ROUTES.messaging,
  ROUTES.networking,
  ROUTES.storage,
])

const assertStructuredData = (route: string, html: string): string[] => {
  const failures: string[] = []
  const types = new Set<string>()
  const scripts = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi
  )

  for (const [, rawJson] of scripts) {
    try {
      const parsed: unknown = JSON.parse(rawJson ?? '')
      const entries = Array.isArray(parsed) ? parsed : [parsed]
      for (const entry of entries) {
        if (isRecord(entry) && typeof entry['@type'] === 'string') {
          types.add(entry['@type'])
        }
      }
    } catch {
      failures.push(`${route} contains invalid JSON-LD`)
    }
  }

  if (route === ROUTES.home && !types.has('Organization')) {
    failures.push(`${route} is missing Organization JSON-LD`)
  }

  const expectsBreadcrumb =
    route === ROUTES.ideas ||
    route === ROUTES.rfps ||
    route.startsWith(`${ROUTES.ideas}/`) ||
    route.startsWith(`${ROUTES.rfps}/`) ||
    route.startsWith(`${ROUTES.fieldGuide}/`) ||
    breadcrumbTechRoutes.has(route)

  if (expectsBreadcrumb && !types.has('BreadcrumbList')) {
    failures.push(`${route} is missing BreadcrumbList JSON-LD`)
  }

  return failures
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
  failures.push(...assertStructuredData(route, html))

  const refs = [
    ...[...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)].map(
      (match) => match[1]
    ),
    ...[...html.matchAll(/\b(?:srcset|imagesrcset)=["']([^"']+)["']/gi)]
      .flatMap((match) => match[1]!.split(','))
      .map((candidate) => candidate.trim().split(/\s+/, 1)[0]),
  ]
  for (const rawHref of refs) {
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

/**
 * The media detail pages should serve the resized copies written by
 * generate-media-assets. One page using them proves the pipeline ran; the
 * asset check above proves every referenced copy was exported.
 */
const assertMediaImages = (): string[] => {
  const articleDir = join(outDir, toRoutePath(ROUTES.mediaArticles))
  if (!existsSync(articleDir)) return ['the export has no media article pages']

  const usesLocalImages = collectHtmlFiles(articleDir).some((file) =>
    readFileSync(file, 'utf8').includes(`/${MEDIA_IMAGE_DIR}/`)
  )
  return usesLocalImages
    ? []
    : [`no media article page uses the resized images in /${MEDIA_IMAGE_DIR}`]
}

/**
 * Media search runs on an index written at build time. Every result has to
 * open a page and show a thumbnail this export actually contains.
 */
const assertMediaSearchIndex = (): string[] => {
  const indexPath = join(outDir, MEDIA_SEARCH_INDEX_FILE)
  if (!existsSync(indexPath)) {
    return [`${MEDIA_SEARCH_INDEX_FILE} is missing from the static export`]
  }

  const { documents } = JSON.parse(
    readFileSync(indexPath, 'utf8')
  ) as MediaSearchIndex
  if (documents.length === 0) return ['the media search index is empty']

  return documents.flatMap((document) => {
    const failures: string[] = []
    if (!findHtmlFile(document.href)) {
      failures.push(`media search links to ${document.href}, which has no page`)
    }
    const imageUrl = document.image?.url ?? ''
    if (
      isLocalAssetHref(imageUrl) &&
      !existsSync(join(outDir, imageUrl.replace(/^\/+/, '')))
    ) {
      failures.push(`media search thumbnail ${imageUrl} was not exported`)
    }
    return failures
  })
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
  failures.push(...assertMediaImages())
  failures.push(...assertMediaSearchIndex())

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
