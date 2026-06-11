import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { describe, expect, test } from 'vitest'

const repoRoot = path.resolve(import.meta.dirname, '../../../..')

const scannedRoots = [
  'content',
  'apps/web/messages',
  'apps/web/constants/routes.ts',
  'apps/web/app/[locale]',
] as const

const forbiddenPatterns = [
  /\bcentraliz(?:e|es|ed|ing|ation|ations)\b/i,
  /\bdecentraliz(?:e|es|ed|ing|ation|ations)\b/i,
  /\bhonor\b/i,
  /\blabor\b/i,
  /\blicense(?:s)?\b/i,
  /\bneighbor(?:s)?\b/i,
  /\bneighborhood(?:s)?\b/i,
  /\borganiz(?:e|es|ed|er|ers|ing|ation|ations)\b/i,
  /\bNode Program\b/i,
  /\bBuilder Programs\b/i,
  /node-program\b/i,
] as const

const fileExtensions = new Set(['.json', '.ts', '.tsx'])

async function listScannedFiles(target: string): Promise<string[]> {
  const absoluteTarget = path.join(repoRoot, target)
  const stat = await readdir(absoluteTarget, { withFileTypes: true }).catch(
    async () => null
  )

  if (!stat) {
    return [absoluteTarget]
  }

  const entries = await Promise.all(
    stat.map(async (entry) => {
      const child = path.join(absoluteTarget, entry.name)
      const relativeChild = path.relative(repoRoot, child)

      if (entry.isDirectory()) {
        return listScannedFiles(relativeChild)
      }

      return fileExtensions.has(path.extname(entry.name)) ? [child] : []
    })
  )

  return entries.flat()
}

function collectJsonStringValues(value: unknown): string[] {
  if (typeof value === 'string') {
    return [value]
  }

  if (Array.isArray(value)) {
    return value.flatMap(collectJsonStringValues)
  }

  if (value && typeof value === 'object') {
    return Object.values(value).flatMap(collectJsonStringValues)
  }

  return []
}

function collectTsStringValues(source: string): string[] {
  const matches = source.matchAll(/(["'`])((?:\\.|(?!\1).)*)\1/gs)

  return Array.from(matches, (match) => match[2] ?? '')
}

function hasForbiddenSpelling(value: string): boolean {
  const withoutUrls = value.replace(/https?:\/\/\S+/g, '')

  return forbiddenPatterns.some((pattern) => pattern.test(withoutUrls))
}

describe('British English content contract', () => {
  test('content, messages, and public paths avoid American spellings', async () => {
    const files = (await Promise.all(scannedRoots.map(listScannedFiles))).flat()
    const failures: string[] = []

    for (const file of files) {
      const relativeFile = path.relative(repoRoot, file)

      if (hasForbiddenSpelling(relativeFile)) {
        failures.push(`${relativeFile}: path`)
      }

      const source = await readFile(file, 'utf8')
      const values =
        path.extname(file) === '.json'
          ? collectJsonStringValues(JSON.parse(source))
          : collectTsStringValues(source)

      values.forEach((value) => {
        if (hasForbiddenSpelling(value)) {
          failures.push(`${relativeFile}: ${value}`)
        }
      })
    }

    expect(failures).toEqual([])
  })
})
