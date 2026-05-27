import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('home feature cards contract', () => {
  test('uses the whole path card as the link target', () => {
    const source = readAppFile(
      '../components/sections/home/feature-cards-section.tsx'
    )

    expect(source).toContain("import { Link } from '@/i18n/navigation'")
    expect(source).toContain('<Link')
    expect(source).toContain('href={card.href}')
    expect(source).toContain('cursor-pointer')
    expect(source).not.toContain('<Button\n        href={card.href}')
  })
})
