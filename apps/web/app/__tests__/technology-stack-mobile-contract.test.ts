import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('technology stack mobile hero contract', () => {
  test('keeps the desktop overview hero aligned below the site header', () => {
    const source = readAppFile(
      '../components/sections/technology-stack/tech-overview-hero.tsx'
    )

    expect(source).toContain('md:pt-8')
    expect(source).not.toContain('md:-mt-0.5')
  })

  test('places the divider below the CTA stack and status after the divider', () => {
    const source = readAppFile(
      '../components/sections/technology-stack/tech-overview-hero.tsx'
    )

    expect(source).toContain(
      '<div className="absolute top-[540px] left-0 h-10 w-full px-3 md:hidden">'
    )
    expect(source).toContain(
      '<div className="absolute top-[540px] left-0 w-full md:hidden">'
    )
    expect(source).not.toContain(
      '<div className="absolute top-[500px] left-0 h-10 w-full px-3 md:hidden">'
    )
  })
})
