import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

export const outDir = join(process.cwd(), 'out')

export const collectHtmlFiles = (dir = outDir): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return collectHtmlFiles(path)
    return path.endsWith('.html') ? [path] : []
  })
}

export const routeToHtmlFile = (route: string): string | null => {
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

export const stripTags = (value: string): string =>
  value
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

export const getAttribute = (
  attributes: string,
  name: string
): string | null => {
  const pattern = new RegExp(`\\b${name}=["']([^"']*)["']`, 'i')
  return pattern.exec(attributes)?.[1] ?? null
}

export const localPathFromHref = (href: string): string | null => {
  if (!href.startsWith('/') || href.startsWith('//')) return null
  return href.split(/[?#]/, 1)[0] ?? null
}

export const isAssetPath = (path: string): boolean =>
  /\.(avif|css|gif|ico|jpeg|jpg|js|json|pdf|png|svg|txt|webp|woff2?|xml|zip)$/i.test(
    path
  )
