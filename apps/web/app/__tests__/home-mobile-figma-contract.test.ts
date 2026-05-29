import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('home mobile Figma section contracts', () => {
  test('Basecamp mobile keeps the intro content in a tight Figma stack', () => {
    const source = readAppFile(
      '../components/sections/home/builder-portal-section.tsx'
    )

    expect(source).toContain('py-[100px]')
    expect(source).toContain('gap-[40px]')
    expect(source).not.toContain('min-h-[531px]')
  })

  test('Tech Stack mobile uses the Figma two-column diagram sizing', () => {
    const section = readAppFile(
      '../components/sections/home/tech-stack-section.tsx'
    )
    const source = readAppFile(
      '../components/sections/shared/tech-stack-diagram.tsx'
    )

    expect(section).toContain("replace(' Technology Stack', '\\nTechnology Stack')")
    expect(source).toContain('grid-cols-2')
    expect(source).toContain('h-[111px]')
    expect(source).toContain('h-[258px]')
    expect(source).not.toContain('grid-cols-1 gap-3 sm:grid-cols-2')
  })

  test('remaining mobile sections preserve their Figma vertical anchors', () => {
    const startBuilding = readAppFile(
      '../components/sections/home/start-building-section.tsx'
    )
    const circlesCta = readAppFile(
      '../components/sections/home/circles-cta-section.tsx'
    )
    const parallelSociety = readAppFile(
      '../components/sections/home/parallel-society-section.tsx'
    )

    expect(startBuilding).toContain('h-[1236px]')
    expect(startBuilding).toContain('h-[319px]')
    expect(circlesCta).toContain('top-[448px]')
    expect(circlesCta).toContain('h-[720px]')
    expect(parallelSociety).toContain('top-[578px]')
    expect(parallelSociety).toContain('h-[440px]')
  })
})
