import { describe, expect, it } from 'vitest'

import { isFeedXml } from '@/lib/media-feeds'

describe('isFeedXml', () => {
  it('accepts an RSS document behind an XML declaration', () => {
    const body =
      '<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"></rss>'

    expect(isFeedXml(body)).toBe(true)
  })

  it('accepts an Atom document that opens with its root element', () => {
    const body = '<feed xmlns="http://www.w3.org/2005/Atom"></feed>'

    expect(isFeedXml(body)).toBe(true)
  })

  it('accepts a document behind leading whitespace or a byte order mark', () => {
    expect(isFeedXml('\n  <?xml version="1.0"?><rss></rss>')).toBe(true)
    expect(isFeedXml('\uFEFF<?xml version="1.0"?><rss></rss>')).toBe(true)
  })

  it('rejects the legacy blog SPA shell served at a feed URL', () => {
    const body =
      '<!DOCTYPE html><html lang="en"><head><title>The Logos Blog</title></head></html>'

    expect(isFeedXml(body)).toBe(false)
  })

  it('rejects an element that merely starts like a feed root', () => {
    expect(isFeedXml('<rssfeedwidget></rssfeedwidget>')).toBe(false)
    expect(isFeedXml('<feedback></feedback>')).toBe(false)
  })

  it('rejects an empty response', () => {
    expect(isFeedXml('')).toBe(false)
  })
})
