import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  fetchPressHtmlFile,
  MAX_HTML_FILE_BYTES,
  resolvePressUploadUrl,
} from '@/lib/blog-content'

vi.mock('@/lib/env', () => ({ env: {} }))

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('resolvePressUploadUrl', () => {
  it('accepts relative and absolute Strapi upload paths', () => {
    expect(resolvePressUploadUrl('/uploads/a.html')).toBe(
      'https://cms-press.logos.co/uploads/a.html'
    )
    expect(
      resolvePressUploadUrl('https://cms-press.logos.co/uploads/b.html')
    ).toBe('https://cms-press.logos.co/uploads/b.html')
  })

  it('rejects an off-origin URL', () => {
    expect(() =>
      resolvePressUploadUrl('http://169.254.169.254/uploads/x.html')
    ).toThrow(/Refusing/)
    expect(() =>
      resolvePressUploadUrl('//internal.example/uploads/x.html')
    ).toThrow(/Refusing/)
  })

  it('rejects a path outside /uploads/', () => {
    expect(() => resolvePressUploadUrl('/api/users')).toThrow(/Refusing/)
    expect(() => resolvePressUploadUrl('/uploads/../admin')).toThrow(/Refusing/)
  })
})

describe('fetchPressHtmlFile', () => {
  it('refuses to follow redirects', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      if (init.redirect === 'error') throw new TypeError('redirect')
      return new Response('internal')
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchPressHtmlFile('/uploads/a.html', 'Article a')
    ).rejects.toThrow('redirect')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://cms-press.logos.co/uploads/a.html',
      expect.objectContaining({ redirect: 'error' })
    )
  })

  it('does not fetch an off-origin URL', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    await expect(
      fetchPressHtmlFile('http://10.0.0.1/uploads/a.html', 'Article a')
    ).rejects.toThrow(/Refusing/)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns the body and rejects one over the size cap', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('<p>ok</p>'))
    )
    await expect(fetchPressHtmlFile('/uploads/a.html', 'a')).resolves.toBe(
      '<p>ok</p>'
    )

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response('x'.repeat(MAX_HTML_FILE_BYTES + 1)))
    )
    await expect(fetchPressHtmlFile('/uploads/a.html', 'a')).rejects.toThrow(
      /larger than/
    )
  })
})
