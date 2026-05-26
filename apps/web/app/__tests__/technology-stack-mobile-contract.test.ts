import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('technology stack mobile hero contract', () => {
  test('places the status block after the 40px divider band', () => {
    const source = readAppFile(
      '../components/sections/technology-stack/tech-overview-hero.tsx'
    )

    expect(source).toContain(
      '<div className="absolute top-[500px] left-0 h-10 w-full px-3 md:hidden">'
    )
    expect(source).toContain(
      '<div className="absolute top-[540px] left-0 w-full md:hidden">'
    )
  })
})
