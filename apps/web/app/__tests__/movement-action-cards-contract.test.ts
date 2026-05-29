import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('movement action cards Figma contract', () => {
  test('renders the three action card CTAs with the light Figma treatment', () => {
    const source = readAppFile(
      '../components/sections/movement/movement-page.tsx'
    )

    expect(source).toMatch(
      /<Cta\s+href=\{card\.href\}\s+label=\{t\(`actions\.\$\{card\.key\}\.cta`\)\}\s+tone="light"/
    )
    expect(source).toContain(
      'className="mx-1.5 mt-auto w-[calc(100%-12px)]"'
    )
  })
})
