import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('storage page spacing contract', () => {
  test('uses the shared detail section spacing instead of page-local margins', () => {
    const source = readAppFile(
      '../app/[locale]/technology-stack/storage/page.tsx'
    )

    expect(source).toContain('TechStackDetailPage')
    expect(source).toContain('TechStackDetailSection')
    expect(source).not.toContain('md:mb-28')
    expect(source).not.toContain('md:mb-25')
  })

  test('defines the desktop technology-stack detail gap in one shared primitive', () => {
    const source = readAppFile(
      '../components/sections/shared/tech-stack-detail-layout.tsx'
    )

    expect(source).toContain('md:mt-[100px]')
  })
})
