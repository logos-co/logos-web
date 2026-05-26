import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('home heading motion contract', () => {
  test('large editorial section headings keep subtle reveal motion', () => {
    const builderPortal = readAppFile(
      '../components/sections/home/builder-portal-section.tsx'
    )
    const circlesCta = readAppFile(
      '../components/sections/home/circles-cta-section.tsx'
    )
    const parallelSociety = readAppFile(
      '../components/sections/home/parallel-society-section.tsx'
    )

    for (const source of [builderPortal, circlesCta, parallelSociety]) {
      expect(source).toMatch(/<Reveal[\s\S]*?amount=\{0\.15\}/)
    }
  })
})
