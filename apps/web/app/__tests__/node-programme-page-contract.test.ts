import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import messages from '../../messages/en.json'
import { describe, expect, test } from 'vitest'

import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

describe('node programme page contract', () => {
  const pageSource = readFileSync(
    fileURLToPath(
      new URL('../[locale]/node-programme/page.tsx', import.meta.url)
    ),
    'utf8'
  )

  test('uses the British English public route', () => {
    expect(ROUTES.nodeProgramme).toBe('/node-programme')
  })

  test('has copy for the signup form and imported source sections', () => {
    // Hero wording can change freely; only require it to be present text.
    expect(typeof messages.pages.nodeProgramme.hero.title).toBe('string')
    expect(
      messages.pages.nodeProgramme.hero.title.trim().length
    ).toBeGreaterThan(0)
    // Roles are functional form values (submitted to the signup API), so they
    // must stay non-empty strings. The set can grow, so we only require the
    // core roles to be present rather than pinning the exact list.
    const { roles } = messages.pages.nodeProgramme.signup
    expect(Array.isArray(roles)).toBe(true)
    expect(roles.length).toBeGreaterThan(0)
    roles.forEach((role) => {
      expect(typeof role).toBe('string')
      expect(role.trim().length).toBeGreaterThan(0)
    })
    expect(roles).toEqual(
      expect.arrayContaining(['Node operator', 'Builder'])
    )
    expect(messages.pages.nodeProgramme.stack.items).toHaveLength(3)
    expect(messages.pages.nodeProgramme.useCases.items).toHaveLength(5)
  })

  test('links the hero CTA group to the node operator guide', () => {
    expect(messages.pages.nodeProgramme.hero.guideCta).toBe(
      'Node operator guide'
    )
    expect(EXTERNAL_URLS.nodeOperatorGuide).toBe(
      'https://docs.logos.co/run-a-node'
    )
    expect(pageSource).toContain('href={EXTERNAL_URLS.nodeOperatorGuide}')
    expect(pageSource).toContain("t('hero.guideCta')")
  })
})
