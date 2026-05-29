import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

function readRepoFile(path: string) {
  return readFileSync(
    fileURLToPath(new URL(`../../../../${path}`, import.meta.url)),
    {
      encoding: 'utf8',
    }
  )
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

  test('reserves mobile space for stack item detail cards', () => {
    const diagram = readAppFile(
      '../components/sections/shared/tech-stack-diagram.tsx'
    )

    expect(diagram).toContain(
      "'items-end justify-between p-1.5 md:items-center md:justify-center md:px-6 md:py-0'"
    )
    expect(diagram).toContain('relative flex flex-col cursor-pointer')
    expect(diagram).toContain(
      "'h-[134px] w-full items-center justify-center px-3 py-[34px] text-center md:h-auto md:w-auto md:px-0 md:py-0'"
    )
    expect(diagram).toContain(
      'relative z-[1] flex w-full shrink-0 flex-col gap-1.5 md:hidden'
    )
    expect(diagram).not.toContain(
      'absolute right-1.5 bottom-1.5 left-1.5 z-[1] flex flex-col gap-1.5 md:hidden'
    )
  })

  test('keeps the app install hover image shift subtle', () => {
    const giantSwitch = readRepoFile(
      'packages/ui/src/primitives/giant-switch/giant-switch.tsx'
    )

    expect(giantSwitch).toContain(
      "const hoverShiftDistance = imagePosition === 'left' ? '12px' : '-12px'"
    )
    expect(giantSwitch).not.toContain('702px')
    expect(giantSwitch).not.toContain('opacity: 0')
  })
})
