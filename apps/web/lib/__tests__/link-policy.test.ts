import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

import { describe, expect, it } from 'vitest'

const repoRoot = join(__dirname, '../../../..')
const scannedRoots = ['apps/web', 'content', 'packages/content'].map((root) =>
  join(repoRoot, root)
)
const blockedPatterns = [
  /href=["']#["']/,
  /href:\s*["']#["']/,
  /https:\/\/forum\.logos\.co/,
  /https:\/\/forum\.vac\.dev/,
  /https:\/\/docs\.logos\.co/,
  /https:\/\/logos\.co\/app/,
  /https:\/\/logos\.co\/office-hours/,
  /https:\/\/github\.com\/logos-co\/boilerplates/,
]

const collectTextFiles = (dir: string): string[] => {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry)
    const stat = statSync(path)
    if (stat.isDirectory()) return collectTextFiles(path)
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
})
