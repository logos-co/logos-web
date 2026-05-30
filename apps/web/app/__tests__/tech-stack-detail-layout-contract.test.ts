import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

const detailPages = [
  '../app/[locale]/technology-stack/blockchain/page.tsx',
  '../app/[locale]/technology-stack/messaging/page.tsx',
  '../app/[locale]/technology-stack/networking/page.tsx',
  '../app/[locale]/technology-stack/storage/page.tsx',
] as const

const detailHeroes = [
  '../components/sections/blockchain/blockchain-hero.tsx',
  '../components/sections/messaging/messaging-hero.tsx',
  '../components/sections/networking/networking-hero.tsx',
  '../components/sections/storage/storage-hero.tsx',
] as const

describe('technology stack detail layout contract', () => {
  test('detail pages reuse the shared 100px section layout primitives', () => {
    for (const page of detailPages) {
      const source = readAppFile(page)

      expect(source).toContain('TechStackDetailPage')
      expect(source).toContain('TechStackDetailSection')
    }
  })

  test('detail heroes reuse the shared hero wrapper for header spacing', () => {
    for (const hero of detailHeroes) {
      const source = readAppFile(hero)

      expect(source).toContain('TechStackDetailHero')
      expect(source).not.toContain('ContentWidth')
    }
  })

  test('shared hero wrapper aligns the back link to the desktop Figma header gap', () => {
    const source = readAppFile(
      '../components/sections/shared/tech-stack-detail-hero.tsx'
    )

    expect(source).toContain('md:pt-[27px]')
    expect(source).not.toContain('<Reveal')
  })
})
