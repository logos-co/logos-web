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

describe('technology stack builder CTA sections', () => {
  test('technology detail pages reuse one shared builder CTA component', () => {
    const routes = [
      '../app/[locale]/technology-stack/blockchain/page.tsx',
      '../app/[locale]/technology-stack/networking/page.tsx',
      '../app/[locale]/technology-stack/messaging/page.tsx',
      '../app/[locale]/technology-stack/storage/page.tsx',
    ]

    for (const route of routes) {
      const source = readAppFile(route)

      expect(source).toContain(
        "@/components/sections/shared/tech-stack-builder-cta"
      )
      expect(source).toContain('<TechStackBuilderCta')
    }
  })

  test('keeps only the shared builder CTA wrapper', () => {
    expect(
      appFileExists('../components/sections/blockchain/blockchain-builder-cta.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/networking/networking-builder-cta.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/messaging/messaging-builder-cta.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/storage/storage-builder-cta.tsx')
    ).toBe(false)
    expect(
      appFileExists('../components/sections/shared/tech-stack-builder-cta.tsx')
    ).toBe(true)
  })
})
