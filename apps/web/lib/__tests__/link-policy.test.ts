import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

const repoRoot = join(__dirname, '../../../..')
const webRoot = join(repoRoot, 'apps/web')
const scannedRoots = ['apps/web', 'content', 'packages/content'].map((root) =>
  join(repoRoot, root)
)
const blockedPatterns = [
  /href=["']#["']/,
  /href:\s*["']#["']/,
  /\?\?\s*["']#["']/,
  /\|\|\s*["']#["']/,
  /https:\/\/forum\.vac\.dev/,
  /https:\/\/logos\.co\/app/,
  /https:\/\/logos\.co\/office-hours/,
  /https:\/\/github\.com\/logos-co\/boilerplates/,
]
const blockedPressResolver = ['resolve', 'Press', 'List'].join('')
const skippedDirectories = new Set(['.next', 'node_modules', 'out'])
const repoPressArticlePaths = [
  'content/press',
  'packages/content/src/loaders/press.ts',
  'packages/content/src/schemas/press.ts',
].map((path) => join(repoRoot, path))

const collectTextFiles = (dir: string): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) {
      return skippedDirectories.has(entry) ? [] : collectTextFiles(path)
    }
    if (!/\.(json|ts|tsx)$/.test(path)) return []
    return [path]
  })
}

describe('link policy', () => {
  it('does not ship placeholder or known-broken links', () => {
    const offenders = scannedRoots.flatMap(collectTextFiles).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return blockedPatterns
        .filter((pattern) => pattern.test(text))
        .map((pattern) => `${relative(repoRoot, file)} matched ${pattern}`)
    })

    expect(offenders).toEqual([])
  })

  it('does not resolve stale repo press fixtures in public web surfaces', () => {
    const offenders = collectTextFiles(webRoot).flatMap((file) => {
      const text = readFileSync(file, 'utf8')
      return text.includes(blockedPressResolver)
        ? [`${relative(repoRoot, file)} resolved repo press fixtures`]
        : []
    })

    expect(offenders).toEqual([])
  })

  it('does not keep repo-owned Press article fixtures or loaders', () => {
    const existingPaths = repoPressArticlePaths
      .filter((path) => existsSync(path))
      .map((path) => relative(repoRoot, path))

    expect(existingPaths).toEqual([])
  })
})
