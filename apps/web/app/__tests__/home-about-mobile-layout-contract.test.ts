import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('home about mobile layout contract', () => {
  test('centres the mobile problem cards and closing copy in the viewport', () => {
    const aboutSection = readAppFile(
      '../components/sections/home/about-section.tsx'
    )

    expect(aboutSection).not.toContain('left-[24px] w-[345px]')
    expect(aboutSection).not.toContain('left-3 flex w-[369px]')
    expect(aboutSection).toMatch(/left-1\/2[\s\S]*?-translate-x-1\/2/)
  })
})
