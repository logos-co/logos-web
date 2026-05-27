import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('lambda prize technology stack contract', () => {
  test('reuses the home technology stack section instead of local cards', () => {
    const page = readAppFile(
      '../app/[locale]/lambda-prize/_sections/lambda-prize-page.tsx'
    )

    expect(page).toContain(
      "import TechStackSection from '@/components/sections/home/tech-stack-section'"
    )
    expect(page).not.toContain('function TechCard')
    expect(page).not.toContain('function WideTechCard')
    expect(page).not.toContain('interface TechCardCopy')
  })

  test('keeps the design systems card sample on the shared diagram', () => {
    const page = readAppFile(
      '../app/[locale]/design-systems/_sections/components.tsx'
    )

    expect(page).toContain(
      "import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'"
    )
    expect(page).not.toContain('function CardGrid')
    expect(page).not.toContain('const cardImages')
    expect(page).not.toContain('The Foundation: Logos Kernel')
  })

  test('does not keep page-local technology stack message copies', () => {
    const messages = JSON.parse(readAppFile('../messages/en.json')) as {
      pages: {
        storage?: { techStack?: unknown }
        technologyStack: { stack: Record<string, unknown> }
      }
    }

    expect(messages.pages.storage?.techStack).toBeUndefined()
    expect(Object.keys(messages.pages.technologyStack.stack).sort()).toEqual([
      'body',
      'titleLine1',
      'titleLine2',
    ])
  })
})
