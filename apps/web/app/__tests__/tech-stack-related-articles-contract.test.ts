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

function readRepoFile(path: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../../../${path}`, import.meta.url)),
    {
      encoding: 'utf8',
    }
  )
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

  test('uses the home press hover treatment and shows reading time for pinned cards', () => {
    const relatedCardSource = readAppFile(
      '../components/sections/shared/related-articles-card.tsx'
    )
    const relatedSectionSource = readAppFile(
      '../components/sections/shared/tech-stack-related-articles.tsx'
    )
    const schemaSource = readRepoFile('packages/content/src/schemas/pages.ts')

    expect(relatedCardSource).toContain('duration-700')
    expect(relatedCardSource).toContain('group-hover:scale-[1.01]')
    expect(relatedCardSource).toContain('group-hover:blur-[4px]')
    expect(relatedCardSource).toContain('{readingTime} min read')
    expect(relatedSectionSource).toContain('readingTime: item.readingTime')
    expect(schemaSource).toContain('readingTime: z.number().int().positive()')

    for (const page of [
      'technology-stack-blockchain',
      'technology-stack-messaging',
      'technology-stack-storage',
    ]) {
      const source = readRepoFile(`content/pages/en/${page}.json`)

      expect(source).toContain('"readingTime"')
    }
  })
})
