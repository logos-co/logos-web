// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildInteractiveDocument } from '../media-interactive-document'
import {
  FRAME_HEIGHT_MESSAGE,
  FRAME_NAVIGATE_MESSAGE,
  FRAME_SYNC_MESSAGE,
  INTERACTIVE_FRAME_SOURCE,
} from '../media-interactive-frame'

let toParent: ReturnType<typeof vi.spyOn>

/**
 * Happy DOM does not run scripts inside iframes, so the injected integration
 * is evaluated against the frame window by hand, the way the browser runs it.
 */
function mountArticle(
  html: string,
  bodyHeight = 0,
  prepare?: (view: Window) => void
) {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  const article = iframe.contentDocument!
  article.open()
  article.write(buildInteractiveDocument(html))
  article.close()
  const view = article.defaultView!
  toParent = vi.spyOn(view.parent, 'postMessage').mockImplementation(() => {})
  vi.spyOn(article.body, 'getBoundingClientRect').mockReturnValue({
    top: 12,
    height: bodyHeight,
  } as DOMRect)
  prepare?.(view as unknown as Window)
  new Function(
    'window',
    'document',
    'getComputedStyle',
    'MutationObserver',
    'ResizeObserver',
    INTERACTIVE_FRAME_SOURCE
  )(
    view,
    article,
    view.getComputedStyle.bind(view),
    view.MutationObserver,
    undefined
  )
  return { article, view }
}

function click(article: Document, selector: string, init = {}) {
  const view = article.defaultView!
  // Happy DOM navigates anchors during bubbling, before document listeners run.
  vi.spyOn(view, 'open').mockReturnValue(null)
  const event = new view.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
    button: 0,
    ...init,
  })
  article.querySelector(selector)!.dispatchEvent(event)
  return event
}

afterEach(() => {
  document.body.replaceChildren()
  vi.restoreAllMocks()
})

describe('full HTML article integration', () => {
  it('runs before an article CSP that would block inline scripts', () => {
    const html = buildInteractiveDocument(
      `<html><head><meta http-equiv="Content-Security-Policy" content="script-src 'none'"></head><body></body></html>`
    )
    expect(html.indexOf(INTERACTIVE_FRAME_SOURCE)).toBeLessThan(
      html.indexOf('Content-Security-Policy')
    )
  })

  it('turns storage that throws in an opaque origin into a missing API', () => {
    const { view } = mountArticle('<p>Article</p>', 0, (view) => {
      Object.defineProperty(view, 'caches', {
        configurable: true,
        get() {
          throw new DOMException('Sandboxed', 'SecurityError')
        },
      })
      Object.defineProperty(view.navigator, 'serviceWorker', {
        configurable: true,
        get() {
          throw new DOMException('Sandboxed', 'SecurityError')
        },
      })
      Object.defineProperty(view, 'localStorage', {
        configurable: true,
        value: 'kept',
      })
    })
    expect(() => view.caches).not.toThrow()
    expect(view.caches).toBeUndefined()
    expect(view.navigator.serviceWorker).toBeUndefined()
    expect(view.localStorage).toBe('kept')
  })

  it('overrides both root backgrounds while preserving card backgrounds', () => {
    const { article } =
      mountArticle(`<!doctype html><html style="background: red !important"><head>
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

  it('reports its height to the parent and again when asked', () => {
    const { view } = mountArticle(
      '<body style="margin-bottom: 20px"><p>Article</p></body>',
      600
    )
    const heights = () =>
      toParent.mock.calls.filter(
        ([data]) => (data as { type: string }).type === FRAME_HEIGHT_MESSAGE
      )
    expect(heights()).toEqual([
      [{ type: FRAME_HEIGHT_MESSAGE, height: 632 }, '*'],
    ])
    const sync = (source: unknown) =>
      view.dispatchEvent(
        Object.assign(new view.Event('message'), {
          data: { type: FRAME_SYNC_MESSAGE },
          source,
        })
      )
    sync(view)
    expect(heights()).toHaveLength(1)
    sync(view.parent)
    expect(heights()).toHaveLength(2)
  })

  it('asks the parent to open internal routes', () => {
    const { article } = mountArticle(
      '<a href="/media/articles"><span>Articles</span></a>'
    )
    expect(click(article, 'span').defaultPrevented).toBe(true)
    expect(toParent).toHaveBeenCalledWith(
      { type: FRAME_NAVIGATE_MESSAGE, href: '/media/articles' },
      '*'
    )
  })

  it.each([
    ['href="#notes"', {}],
    ['href="mailto:hello@example.com"', {}],
    ['href="tel:+123"', {}],
    ['href="//evil.example"', {}],
    ['href="/\\evil.example"', {}],
    ['href="/media/articles" download', {}],
    ['href="/media/articles" target="_blank"', {}],
    ['href="/media/articles"', { ctrlKey: true }],
    ['href="/media/articles"', { metaKey: true }],
  ])(
    'leaves native navigation intact for %s with %j',
    (attributes, modifiers) => {
      const { article } = mountArticle(`<a ${attributes}>Link</a>`)
      expect(click(article, 'a', modifiers).defaultPrevented).toBe(false)
      expect(toParent).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: FRAME_NAVIGATE_MESSAGE }),
        '*'
      )
    }
  )
})
