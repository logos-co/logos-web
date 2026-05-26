import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { describe, expect, test } from 'vitest'

function readAppFile(path: string) {
  return readFileSync(fileURLToPath(new URL(`../${path}`, import.meta.url)), {
    encoding: 'utf8',
  })
}

describe('static export navigation contract', () => {
  test('disables Next link prefetch through the shared i18n link', () => {
    const navigation = readAppFile('../i18n/navigation.ts')

    expect(navigation).toContain('prefetch: false')
  })

  test('keeps internal links on the shared i18n link wrapper', () => {
    const docsToc = readAppFile(
      '../components/sections/shared/docs-toc.tsx'
    )

    expect(docsToc).toContain("import { Link } from '@/i18n/navigation'")
    expect(docsToc).not.toContain("from 'next/link'")
  })

  test('uses document navigation after the transition cover instead of the Next router', () => {
    const transition = readAppFile('../components/page-transition.tsx')

    expect(transition).toContain('window.location.assign')
    expect(transition).not.toContain('router.push')
  })

  test('keeps document navigation active for reduced-motion users', () => {
    const transition = readAppFile('../components/page-transition.tsx')

    expect(transition).not.toContain('if (shouldReduceMotion) return')
  })
})
