import { describe, expect, test } from 'vitest'

import { prepareCmsLinks } from '@/lib/html-links'

describe('prepareCmsLinks', () => {
  test('opens an outbound link in a new tab', () => {
    expect(prepareCmsLinks('<a href="https://logos.co">Logos</a>')).toBe(
      '<a target="_blank" rel="noopener noreferrer" href="https://logos.co">Logos</a>'
    )
  })

  test('keeps footnote and heading links in the page', () => {
    const html =
      '<a class="footnote" href="#fnt-12"><sup>[12]</sup></a><a href=\'#intro\'>Intro</a>'

    expect(prepareCmsLinks(html)).toBe(html)
  })

  test.each(['mailto:pressengine@logos.co', 'tel:+41000000000'])(
    'leaves %s links alone',
    (href) => {
      const html = `<a href="${href}">Contact</a>`

      expect(prepareCmsLinks(html)).toBe(html)
    }
  )

  test('keeps a target the author already set', () => {
    const html = '<a href="https://logos.co" target="_self">Logos</a>'

    expect(prepareCmsLinks(html)).toBe(html)
  })

  test('adds to an existing rel instead of writing a second one', () => {
    expect(
      prepareCmsLinks('<a rel="nofollow" href="https://logos.co">Logos</a>')
    ).toBe(
      '<a target="_blank" rel="nofollow noopener noreferrer" href="https://logos.co">Logos</a>'
    )
  })

  test('does not mistake data-target for a target', () => {
    expect(
      prepareCmsLinks('<a data-target="menu" href="https://logos.co">Logos</a>')
    ).toBe(
      '<a target="_blank" rel="noopener noreferrer" data-target="menu" href="https://logos.co">Logos</a>'
    )
  })

  test('leaves anchors without an href alone', () => {
    const html = '<a id="fnt-12"></a>'

    expect(prepareCmsLinks(html)).toBe(html)
  })

  test('keeps links to other pages of the site in the tab', () => {
    const html = '<a href="/media/article/june-2026">June</a>'

    expect(prepareCmsLinks(html)).toBe(html)
  })

  test.each([
    [
      'https://blog.logos.co/article/radical-humility',
      '/media/article/radical-humility',
    ],
    [
      'https://blog.logos.co/article/upskilling-support-abeokuta-enugu/id/134',
      '/media/article/upskilling-support-abeokuta-enugu',
    ],
    [
      'https://blog.logos.co/podcasts/logos-state/jameson-lopp?t=1#notes',
      '/media/podcasts/logos-state/jameson-lopp#notes',
    ],
    ['http://blog.logos.co/podcasts', '/media#podcasts'],
    [
      'https://press.logos.co/article/spirit-of-freedom',
      '/media/article/spirit-of-freedom',
    ],
    ['http://press.logos.co/calendar', '/logos-broadcast-network'],
    ['https://blog.logos.co/search?q=privacy', '/media'],
  ])('points the old blog link %s at %s', (oldUrl, mediaPath) => {
    // blog.logos.co is being switched off; editors linked posts with it.
    expect(prepareCmsLinks(`<a class="x" href="${oldUrl}">Post</a>`)).toBe(
      `<a class="x" href="${mediaPath}">Post</a>`
    )
  })
})
