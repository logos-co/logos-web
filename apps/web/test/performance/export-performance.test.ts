import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

import { criticalRoutes, performanceBudgets } from './budgets'
import {
  type PerformanceReport,
  type RoutePerformanceMetrics,
  writePerformanceReport,
} from './report'

const outDir = join(process.cwd(), 'out')

const findHtmlFile = (route: string): string | null => {
  const routePath = route === '/' ? '' : route.replace(/^\/+/, '')
  const candidates =
    routePath === ''
      ? [join(outDir, 'index.html')]
      : [
          join(outDir, routePath, 'index.html'),
          join(outDir, `${routePath}.html`),
        ]

  return candidates.find((candidate) => existsSync(candidate)) ?? null
}

const localAssetPath = (href: string): string | null => {
  if (!href.startsWith('/') || href.startsWith('//')) return null
  if (href.startsWith('/#')) return null
  const path = href.split(/[?#]/, 1)[0]
  if (!path) return null
  return join(outDir, path.replace(/^\/+/, ''))
}

const classifyAsset = (filePath: string): 'css' | 'image' | 'script' | null => {
  if (/\.(avif|gif|jpeg|jpg|png|svg|webp)$/i.test(filePath)) return 'image'
  if (/\.css$/i.test(filePath)) return 'css'
  if (/\.js$/i.test(filePath)) return 'script'
  return null
}

const measureRoute = (route: string): RoutePerformanceMetrics => {
  const htmlFile = findHtmlFile(route)
  if (!htmlFile) {
    throw new Error(`${route} did not export an HTML file`)
  }

  const html = readFileSync(htmlFile, 'utf8')
  const htmlBytes = Buffer.byteLength(html)
  const assetFiles = new Set<string>()
  const refs = html.matchAll(/\b(?:href|src)=["']([^"']+)["']/g)
  for (const [, href] of refs) {
    if (!href) continue
    const assetPath = localAssetPath(href)
    if (assetPath && existsSync(assetPath) && statSync(assetPath).isFile()) {
      assetFiles.add(assetPath)
    }
  }

  let cssBytes = 0
  let imageBytes = 0
  let scriptBytes = 0
  for (const filePath of assetFiles) {
    const size = statSync(filePath).size
    switch (classifyAsset(filePath)) {
      case 'css':
        cssBytes += size
        break
      case 'image':
        imageBytes += size
        break
      case 'script':
        scriptBytes += size
        break
    }
  }

  return {
    cssBytes,
    htmlBytes,
    imageBytes,
    route,
    scriptBytes,
    totalTransferBytes: htmlBytes + cssBytes + imageBytes + scriptBytes,
  }
}

const assertBudget = (
  failures: string[],
  route: string,
  metricName: keyof typeof performanceBudgets,
  value: number
): void => {
  const budget = performanceBudgets[metricName]
  if (value > budget) {
    failures.push(`${route} ${metricName}=${value} exceeded budget=${budget}`)
  }
}

const main = (): void => {
  if (!existsSync(outDir)) {
    throw new Error(
      'apps/web/out does not exist; run pnpm --filter web build first'
    )
  }

  const routes = criticalRoutes.map(measureRoute)
  const report: PerformanceReport = {
    budgets: performanceBudgets,
    generatedAt: new Date().toISOString(),
    routes,
  }
  writePerformanceReport(report)

  const failures: string[] = []
  for (const route of routes) {
    assertBudget(failures, route.route, 'maxHtmlBytes', route.htmlBytes)
    assertBudget(
      failures,
      route.route,
      'maxTotalTransferBytes',
      route.totalTransferBytes
    )
    assertBudget(failures, route.route, 'maxImageBytes', route.imageBytes)
    assertBudget(failures, route.route, 'maxScriptBytes', route.scriptBytes)
    assertBudget(failures, route.route, 'maxCssBytes', route.cssBytes)
  }

  if (failures.length > 0) {
    throw new Error(`performance smoke failed:\n${failures.join('\n')}`)
  }

  console.log('performance smoke passed')
}

main()
