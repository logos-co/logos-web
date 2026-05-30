import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readComponent(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('Basecamp Figma typography contracts', () => {
  test('uses the shared technology-stack spacing rhythm below the header', () => {
    const source = readComponent(
      '../components/sections/basecamp/basecamp-page.tsx'
    )

    expect(source).toContain('TechStackDetailPage')
    expect(source).toContain('TechStackDetailSection')
    expect(source).toContain('<ContentWidth className="!p-0">')
  })

  test('capability cards use the Figma sans title and body sizes', () => {
    const source = readComponent(
      '../components/sections/basecamp/basecamp-page.tsx'
    )

    expect(source).toContain(
      'font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green'
    )
    expect(source).toContain(
      'font-sans text-[14px] leading-[1.2] text-brand-dark-green'
    )
    expect(source).not.toContain(
      '<h3 className="text-subhead-sans text-brand-dark-green">'
    )
    expect(source).not.toContain(
      '<p className="text-body-s max-w-[329px] text-brand-dark-green">'
    )
  })

  test('modular section heading matches the Figma H4 sans scale', () => {
    const source = readComponent(
      '../components/sections/basecamp/basecamp-page.tsx'
    )

    expect(source).toContain(
      '<h2 className="font-sans text-[24px] font-normal leading-[1.1] tracking-[-0.24px] text-brand-dark-green">'
    )
    expect(source).not.toContain(
      '<h2 className="text-h3 text-brand-dark-green">'
    )
  })
})
