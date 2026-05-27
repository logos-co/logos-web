import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readComponent(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('broadcast network page contract', () => {
  test('past episodes match the Figma row without descriptions', () => {
    const source = readComponent(
      './[locale]/logos-broadcast-network/_sections/broadcast-network-page.tsx'
    )

    expect(source).not.toContain('{podcast.description}')
    expect(source).toContain('h-[107px] w-[190px]')
    expect(source).not.toContain('size-[107px]')
  })
})
