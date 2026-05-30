import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('storage page spacing contract', () => {
  test('keeps the Figma desktop gap from builder CTA into tech-stack explorer', () => {
    const source = readAppFile(
      '../app/[locale]/technology-stack/storage/page.tsx'
    )

    expect(source).toContain('className="mt-15 mb-15 md:mt-25 md:mb-28"')
    expect(source).not.toContain('className="mt-15 mb-15 md:mt-25 md:mb-25"')
  })
})
