import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('storage use cases Figma contract', () => {
  test('uses compressed Figma-specific images and the off-white CTA treatment', () => {
    const source = readAppFile(
      '../components/sections/storage/storage-use-cases.tsx'
    )

    expect(source).toContain('/images/storage/use-case-figma-1.webp')
    expect(source).toContain('/images/storage/use-case-figma-2.webp')
    expect(source).toContain('rotate-90')
    expect(source).toContain('blur-[20px]')
    expect(source).toContain('bg-brand-off-white text-brand-dark-green')
  })
})
