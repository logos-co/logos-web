import { describe, expect, test } from 'vitest'

import { addTargetBlank } from '@/lib/html-links'

describe('addTargetBlank', () => {
  test('opens an outbound link in a new tab', () => {
    expect(addTargetBlank('<a href="https://logos.co">Logos</a>')).toBe(
      '<a target="_blank" rel="noopener noreferrer" href="https://logos.co">Logos</a>'
    )
  })

  test('keeps footnote and heading links in the page', () => {
    const html =
      '<a class="footnote" href="#fnt-12"><sup>[12]</sup></a><a href=\'#intro\'>Intro</a>'

    expect(addTargetBlank(html)).toBe(html)
  })

  test.each(['mailto:pressengine@logos.co', 'tel:+41000000000'])(
    'leaves %s links alone',
    (href) => {
      const html = `<a href="${href}">Contact</a>`

      expect(addTargetBlank(html)).toBe(html)
    }
  )

  test('keeps a target the author already set', () => {
    const html = '<a href="https://logos.co" target="_self">Logos</a>'

    expect(addTargetBlank(html)).toBe(html)
  })

  test('adds to an existing rel instead of writing a second one', () => {
    expect(
      addTargetBlank('<a rel="nofollow" href="https://logos.co">Logos</a>')
    ).toBe(
      '<a target="_blank" rel="nofollow noopener noreferrer" href="https://logos.co">Logos</a>'
    )
  })

  test('does not mistake data-target for a target', () => {
    expect(
      addTargetBlank('<a data-target="menu" href="https://logos.co">Logos</a>')
    ).toBe(
      '<a target="_blank" rel="noopener noreferrer" data-target="menu" href="https://logos.co">Logos</a>'
    )
  })

  test('leaves anchors without an href alone', () => {
    const html = '<a id="fnt-12"></a>'

    expect(addTargetBlank(html)).toBe(html)
  })
})
