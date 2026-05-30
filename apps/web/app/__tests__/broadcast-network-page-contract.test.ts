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
    expect(source).toContain('grid-cols-[190px_524px_573px]')
    expect(source).toContain('aspect-video h-auto w-[174px]')
    expect(source).not.toContain('size-[107px]')
  })

  test('header background matches the press audio page tone', () => {
    const source = readComponent(
      '../components/site-header/site-header-client.tsx'
    )

    expect(source).toContain('usesAccentTanHeaderTone')
    expect(source).toContain('ROUTES.logosBroadcastNetwork')
    expect(source).toContain('ROUTES.podcast')
    expect(source).toContain(
      "usesAccentTanHeaderTone && 'bg-accent-tan'"
    )
  })
})
