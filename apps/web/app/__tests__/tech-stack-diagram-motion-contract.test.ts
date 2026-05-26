import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('tech stack diagram motion contract', () => {
  test('makes the whole stack item card the link target', () => {
    const diagram = readAppFile(
      '../components/sections/shared/tech-stack-diagram.tsx'
    )

    expect(diagram).toContain("import { Link } from '@/i18n/navigation'")
    expect(diagram).toContain('<Link\n      href={href}')
    expect(diagram).not.toContain('<Button\n        href={href}')
  })

  test('moves labels higher when a stack item reveals two detail cards', () => {
    const diagram = readAppFile(
      '../components/sections/shared/tech-stack-diagram.tsx'
    )

    expect(diagram).toContain('details.length > 1')
    expect(diagram).toContain(
      "'md:group-hover/stack-item:-translate-y-24'"
    )
    expect(diagram).toContain("'md:group-hover/stack-item:-translate-y-8'")
  })
})
