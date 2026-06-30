import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, test } from 'vitest'

import { createDefaultMetadata } from '@/lib/metadata'

const publicDir = join(process.cwd(), 'public')
const faviconVersion = 'v=20260630'

describe('favicon metadata', () => {
  test('declares explicit browser icons instead of relying on ico only', async () => {
    const metadata = await createDefaultMetadata({
      locale: 'en',
      title: 'Logos',
      description: 'Logos',
    })

    expect(metadata.icons).toEqual({
      icon: [
        {
          url: `/favicon.svg?${faviconVersion}`,
          type: 'image/svg+xml',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: `/favicon-dark.svg?${faviconVersion}`,
          type: 'image/svg+xml',
          media: '(prefers-color-scheme: dark)',
        },
        {
          url: `/favicon-32x32.png?${faviconVersion}`,
          sizes: '32x32',
          type: 'image/png',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: `/favicon-32x32-dark.png?${faviconVersion}`,
          sizes: '32x32',
          type: 'image/png',
          media: '(prefers-color-scheme: dark)',
        },
        {
          url: `/favicon-16x16.png?${faviconVersion}`,
          sizes: '16x16',
          type: 'image/png',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: `/favicon-16x16-dark.png?${faviconVersion}`,
          sizes: '16x16',
          type: 'image/png',
          media: '(prefers-color-scheme: dark)',
        },
        {
          url: `/favicon.ico?${faviconVersion}`,
          sizes: 'any',
          media: '(prefers-color-scheme: light)',
        },
        {
          url: `/favicon-dark.ico?${faviconVersion}`,
          sizes: 'any',
          media: '(prefers-color-scheme: dark)',
        },
      ],
      apple: [
        { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
    })
  })

  test('keeps favicon SVGs background-free with mode-specific mark colours', () => {
    const lightSvg = readFileSync(join(publicDir, 'favicon.svg'), 'utf8')
    const darkSvg = readFileSync(join(publicDir, 'favicon-dark.svg'), 'utf8')

    expect(lightSvg).not.toContain('<rect')
    expect(darkSvg).not.toContain('<rect')
    expect(lightSvg).toContain('fill="#000000"')
    expect(darkSvg).toContain('fill="#f5f5ef"')
  })

  test('versions favicon URLs so Chrome refreshes its favicon cache', async () => {
    const metadata = await createDefaultMetadata({
      locale: 'en',
      title: 'Logos',
      description: 'Logos',
    })

    const icons = metadata.icons
    expect(icons).toBeTypeOf('object')
    if (icons === null || typeof icons !== 'object' || Array.isArray(icons)) {
      throw new Error('Expected object icon metadata')
    }

    const iconList = Array.isArray(icons.icon) ? icons.icon : [icons.icon]
    for (const icon of iconList) {
      if (typeof icon === 'string' || icon === undefined) {
        throw new Error('Expected descriptor icon metadata')
      }
      expect(icon.url.toString()).toContain(`?${faviconVersion}`)
    }
  })

  test.each([
    'favicon.ico',
    'favicon-dark.ico',
    'favicon.svg',
    'favicon-dark.svg',
    'favicon-32x32.png',
    'favicon-32x32-dark.png',
    'favicon-16x16.png',
    'favicon-16x16-dark.png',
    'apple-touch-icon.png',
  ])('ships %s from public assets', (fileName) => {
    expect(existsSync(join(publicDir, fileName))).toBe(true)
  })
})
