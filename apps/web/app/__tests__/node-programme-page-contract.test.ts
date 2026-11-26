import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

import nodeProgrammeContent from '../../../../content/pages/en/node-programme.json' with { type: 'json' }

const readNodeProgrammePageSource = () =>
  readFileSync(
    fileURLToPath(
      new URL('../[locale]/node-programme/page.tsx', import.meta.url)
    ),
    'utf8'
  )

type NodeProgrammeCopySection = {
  componentType: 'nodeProgrammeCopy'
  key: string
  hero: { title: string; guideCta: string }
  signup: { roles: string[] }
  stack: { items: unknown[] }
  useCases: { items: unknown[] }
}

describe('node programme page contract', () => {
  test('uses the British English public route', () => {
    expect(ROUTES.nodeProgramme).toBe('/node-programme')
  })

  test('has copy for the signup form and imported source sections', () => {
    const section = nodeProgrammeContent.sections[0] as NodeProgrammeCopySection

    // Hero wording can change freely; only require it to be present text.
    expect(typeof section.hero.title).toBe('string')
    expect(section.hero.title.trim().length).toBeGreaterThan(0)

    // Roles are functional form values (submitted to the signup API), so they
    // must stay non-empty strings. The set can grow, so we only require the
    // core roles to be present rather than pinning the exact list.
    const { roles } = section.signup
    expect(Array.isArray(roles)).toBe(true)
    expect(roles.length).toBeGreaterThan(0)
    roles.forEach((role) => {
      expect(typeof role).toBe('string')
      expect(role.trim().length).toBeGreaterThan(0)
    })
    expect(roles).toEqual(
      expect.arrayContaining(['Node operator', 'Builder'])
    )
    expect(section.stack.items).toHaveLength(3)
    expect(section.useCases.items).toHaveLength(5)
  })

  test('links the hero CTA group to the node operator guide', () => {
    const section = nodeProgrammeContent.sections[0] as NodeProgrammeCopySection
    const pageSource = readNodeProgrammePageSource()

    expect(section.hero.guideCta).toBe('Node operator guide')
    expect(EXTERNAL_URLS.nodeOperatorGuide).toBe(
      'https://docs.logos.co/run-a-node'
    )
    expect(pageSource).toContain('href={EXTERNAL_URLS.nodeOperatorGuide}')
    expect(pageSource).toContain('{data.hero.guideCta}')
  })
})
