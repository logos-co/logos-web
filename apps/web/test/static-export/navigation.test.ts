import { existsSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'

import {
  collectHtmlFiles,
  getAttribute,
  isAssetPath,
  localPathFromHref,
  outDir,
  routeToHtmlFile,
} from './helpers'

const htmlRouteExists = (path: string): boolean => {
  if (path === '/') return routeToHtmlFile('/') !== null
  return routeToHtmlFile(path) !== null
}

const hasAnchorTarget = (htmlFile: string, hash: string): boolean => {
  const id = hash.replace(/^#/, '')
  if (!id) return true
  if (id.includes('=')) return true
  const html = readFileSync(htmlFile, 'utf8')
  const escaped = id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`\\bid=["']${escaped}["']`).test(html)
}

const assertNavigation = (htmlFile: string): string[] => {
  const routeLabel = relative(outDir, htmlFile)
  const html = readFileSync(htmlFile, 'utf8')
  const failures: string[] = []

  for (const match of html.matchAll(/<a\b([^>]*)>/gi)) {
    const attributes = match[1] ?? ''
    const href = getAttribute(attributes, 'href')
    if (!href) {
      failures.push(`${routeLabel} has an anchor without href`)
      continue
    }
    if (href === '#') {
      failures.push(`${routeLabel} has a placeholder href`)
      continue
    }
    if (href.startsWith('/en/')) {
      failures.push(
        `${routeLabel} still links to stripped default locale ${href}`
      )
      continue
    }
    if (/^(mailto:|tel:|https?:\/\/|#)/.test(href)) {
      if (href.startsWith('#') && !hasAnchorTarget(htmlFile, href)) {
        failures.push(`${routeLabel} links to missing hash target ${href}`)
      }
      continue
    }

    const localPath = localPathFromHref(href)
    if (!localPath) continue

    if (isAssetPath(localPath)) {
      const assetFile = join(outDir, localPath.replace(/^\/+/, ''))
      if (!existsSync(assetFile)) {
        failures.push(`${routeLabel} links to missing asset ${localPath}`)
      }
      continue
    }

    const [routePath, hash] = href.split('#', 2)
    const normalizedRoute = routePath || '/'
    const targetHtml = routeToHtmlFile(normalizedRoute)
    if (!targetHtml || !htmlRouteExists(normalizedRoute)) {
      failures.push(`${routeLabel} links to missing route ${normalizedRoute}`)
      continue
    }
    if (hash && !hasAnchorTarget(targetHtml, `#${hash}`)) {
      failures.push(`${routeLabel} links to missing hash target ${href}`)
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

  const failures = collectHtmlFiles().flatMap(assertNavigation)
  if (failures.length > 0) {
    console.warn(
      `navigation smoke found ${failures.length} issue(s):\n${failures.join('\n')}`
    )
    return
  }

  console.log('navigation smoke passed')
}

main()
