// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildInteractiveDocument } from '../media-interactive-document'
import { observeInteractiveFrame } from '../media-interactive-frame'

const cleanups: Array<() => void> = []

function mountArticle(html: string) {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const article = iframe.contentDocument!
  article.open()
  article.write(buildInteractiveDocument(html))
  article.close()
  cleanups.push(observeInteractiveFrame(iframe))
  iframe.dispatchEvent(new Event('load'))
  return { iframe, article }
}

afterEach(() => {
  cleanups.splice(0).forEach((cleanup) => cleanup())
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('full HTML article integration', () => {
  it('overrides both root backgrounds while preserving card backgrounds', () => {
    const { article } =
      mountArticle(`<!doctype html><html style="background: red !important"><head>
      <meta http-equiv="Content-Security-Policy" content="default-src https:; script-src 'none'; style-src 'unsafe-inline'">
      </head><body style="background: blue !important"><div id="card" style="background: white">Card</div></body></html>`)
    for (const root of [article.documentElement, article.body]) {
      expect(article.defaultView!.getComputedStyle(root).backgroundColor).toBe(
        'transparent'
      )
      expect(root.style.getPropertyPriority('background')).toBe('important')
    }
    expect(
      article.defaultView!.getComputedStyle(article.querySelector('#card')!)
        .backgroundColor
    ).toBe('white')
  })

  it('preserves same-tab targets and rel metadata while securing new tabs', () => {
    const { article } =
      mountArticle(`<a id="site" href="/media/articles">Site</a>
      <a id="mail" href="mailto:hello@example.com">Mail</a><a id="phone" href="tel:+123">Phone</a>
      <a id="anchor" href="#notes">Notes</a><a id="legacy" href="https://blog.logos.co/article/example">Legacy</a>
      <a id="external" href="https://example.com" rel="nofollow sponsored">External</a>
      <a id="blank" href="https://example.com" target="_blank" rel="sponsored">Blank</a>
      <a id="self" href="https://example.com" target="_self" rel="nofollow">Self</a>`)
    for (const id of ['site', 'mail', 'phone', 'anchor', 'legacy']) {
      expect(article.querySelector<HTMLAnchorElement>(`#${id}`)!.target).toBe(
        ''
      )
    }
    expect(article.querySelector('#legacy')!.getAttribute('href')).toBe(
      '/media/article/example'
    )
    expect(article.querySelector('#external')!.getAttribute('rel')).toBe(
      'nofollow sponsored noopener noreferrer'
    )
    expect(article.querySelector('#blank')!.getAttribute('rel')).toBe(
      'sponsored noopener noreferrer'
    )
    expect(article.querySelector('#self')!.getAttribute('rel')).toBe('nofollow')
    expect(article.querySelector<HTMLAnchorElement>('#self')!.target).toBe(
      '_self'
    )
  })

  it('opens internal routes in the parent and removes the handler on cleanup', () => {
    const navigate = vi
      .spyOn(window.location, 'assign')
      .mockImplementation(() => {})
    const { article } = mountArticle(
      '<a href="/media/articles"><span>Articles</span></a>'
    )
    // Happy DOM navigates anchors during bubbling, before document listeners run.
    vi.spyOn(article.defaultView!, 'open').mockReturnValue(null)
    const click = () => {
      const event = new article.defaultView!.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
      })
      article.querySelector('span')!.dispatchEvent(event)
      return event
    }
    expect(click().defaultPrevented).toBe(true)
    expect(navigate).toHaveBeenCalledWith('/media/articles')
    cleanups.splice(0).forEach((cleanup) => cleanup())
    navigate.mockClear()
    expect(click().defaultPrevented).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })

  it.each([
    ['href="#notes"', {}],
    ['href="mailto:hello@example.com"', {}],
    ['href="tel:+123"', {}],
    ['href="/media/articles" download', {}],
    ['href="/media/articles" target="_blank"', {}],
    ['href="/media/articles"', { ctrlKey: true }],
    ['href="/media/articles"', { metaKey: true }],
  ])(
    'leaves native navigation intact for %s with %j',
    (attributes, modifiers) => {
      const navigate = vi
        .spyOn(window.location, 'assign')
        .mockImplementation(() => {})
      const { article } = mountArticle(`<a ${attributes}>Link</a>`)
      vi.spyOn(article.defaultView!, 'open').mockReturnValue(null)
      const event = new article.defaultView!.MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        button: 0,
        ...modifiers,
      })
      article.querySelector('a')!.dispatchEvent(event)
      expect(event.defaultPrevented).toBe(false)
      expect(navigate).not.toHaveBeenCalled()
    }
  )
})
