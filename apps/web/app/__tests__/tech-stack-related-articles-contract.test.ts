import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

function appFileExists(path: string) {
  return existsSync(fileURLToPath(new URL(`../${path}`, import.meta.url)))
}

describe('technology stack related articles sections', () => {
  test('technology detail pages reuse one shared section component', () => {
    const routes = [
      '../app/[locale]/technology-stack/blockchain/page.tsx',
      '../app/[locale]/technology-stack/networking/page.tsx',
      '../app/[locale]/technology-stack/messaging/page.tsx',
      '../app/[locale]/technology-stack/storage/page.tsx',
    ]

    for (const route of routes) {
      const source = readAppFile(route)

      expect(source).toContain(
        "@/components/sections/shared/tech-stack-related-articles"
      )
      expect(source).toContain('<TechStackRelatedArticles')
    }
  })

  test('keeps only shared related articles card building blocks', () => {
    expect(
      appFileExists('../components/sections/blockchain/blockchain-related-articles.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/networking/networking-related-articles.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/messaging/messaging-related-articles.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/storage/storage-related-articles.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/shared/tech-stack-related-articles.tsx')
    ).toBe(true)
  })

  test('keeps the Figma 12px gap between the tan card and footer', () => {
    const source = readAppFile(
      '../components/sections/shared/tech-stack-related-articles.tsx'
    )

    expect(source).toContain('mx-auto h-220 max-w-360 px-3 py-3')
    expect(source).not.toContain('md:pb-25')
    expect(source).not.toContain('md:pb-3')
  })
})
