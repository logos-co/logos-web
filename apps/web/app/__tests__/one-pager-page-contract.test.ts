import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

import { ROUTES } from '@/constants/routes'

import messages from '../../messages/en.json' with { type: 'json' }

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

const page = readAppFile('[locale]/one-pager/page.tsx')
const section = readAppFile('[locale]/one-pager/_sections/one-pager-upload.tsx')

describe('one pager page contract', () => {
  test('is served from the route the emailed link points at', () => {
    expect(ROUTES.onePager).toBe('/one-pager')
    expect(page).toContain('ROUTES.onePager')
  })

  test('keeps the page out of search results', () => {
    expect(page).toContain('noindex: true')
  })

  test('wraps the search-param reader in a Suspense boundary', () => {
    // Without it the static export build fails.
    expect(section).toContain('useSearchParams')
    expect(page).toContain('<Suspense>')
  })

  test('has copy for every state the upload flow can land in', () => {
    expect(Object.keys(messages.pages.onePager)).toEqual(
      expect.arrayContaining([
        'heading',
        'intro',
        'requirements',
        'submit',
        'submitting',
        'successHeading',
        'successBody',
        'usedHeading',
        'usedBody',
        'invalidHeading',
        'invalidBody',
        'missingTokenHeading',
        'missingTokenBody',
        'errorType',
        'errorEmpty',
        'errorSize',
        'errorGeneric',
      ])
    )
  })
})
