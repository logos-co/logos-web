import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

function readRepoFile(path: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../../../${path}`, import.meta.url)),
    {
      encoding: 'utf8',
    }
  )
}

describe('messaging case studies layout contract', () => {
  test('allows revealed cards to grow in the desktop row', () => {
    const source = readAppFile(
      '../components/sections/messaging/messaging-case-studies.tsx'
    )

    expect(source).toContain('md:mt-25')
    expect(source).toContain(
      '<RevealItem key={card.title} className="md:flex-1">'
    )
  })
})

describe('messaging page Figma layout contract', () => {
  test('uses the messaging-specific desktop hero height from Figma', () => {
    const source = readAppFile(
      '../components/sections/messaging/messaging-hero.tsx'
    )

    expect(source).toContain('className="md:h-[453px]"')
  })

  test('keeps the overview section tall enough for the desktop copy', () => {
    const source = readAppFile(
      '../components/sections/messaging/messaging-intro.tsx'
    )

    expect(source).toContain('md:h-[235px]')
    expect(source).toContain('md:mb-[100px]')
    expect(source).toContain('privacy.mobileDescription')
  })

  test('keeps feature panels inside the 1440px Figma frame', () => {
    const source = readAppFile(
      '../components/sections/messaging/messaging-intro.tsx'
    )

    expect(source).toContain('max-w-[1440px]')
    expect(source).toContain('md:h-[335px] md:grid-cols-2')
    expect(source).toContain('tone="gray-02"')
    expect(source).toContain('/images/messaging/delivery.webp')
    expect(source).toContain('/images/messaging/chat.webp')
    expect(source).toContain('md:top-[calc(50%+12px)]')
    expect(source).toContain('md:top-[calc(50%-68px)]')
  })

  test('keeps the builder CTA aligned to the desktop Figma spacing', () => {
    const source = readAppFile(
      '../app/[locale]/technology-stack/messaging/page.tsx'
    )

    expect(source).toContain('md:mt-[100px]')
    expect(source).toContain('md:mb-[100px]')
  })

  test('keeps the desktop Figma gap before related articles', () => {
    const source = readAppFile(
      '../components/sections/messaging/messaging-tech-stack.tsx'
    )

    expect(source).toContain('md:mb-[100px]')
  })

  test('keeps mobile-only Figma copy in content instead of component literals', () => {
    const schema = readRepoFile('packages/content/src/schemas/pages.ts')
    const content = readRepoFile(
      'content/pages/en/technology-stack-messaging.json'
    )

    expect(schema).toContain('mobileDescription: z.string().min(1).optional()')
    expect(content).toContain('"mobileTitle": "Logos Messaging Nim (LMN)"')
    expect(content).toContain('"mobileEyebrow": "Privacy"')
    expect(content).toContain('"label": "Repo"')
    expect(content).toContain('"label": "Docs"')
  })
})
