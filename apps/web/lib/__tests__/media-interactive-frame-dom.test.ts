// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest'

import { buildInteractiveDocument } from '../media-interactive-document'
import {
  FRAME_HEIGHT_MESSAGE,
  FRAME_NAVIGATE_MESSAGE,
  FRAME_SYNC_MESSAGE,
  DEFAULT_HOST_STORAGE,
  type FrameSize,
  type HostStorage,
  interactiveFrameSource,
} from '../media-interactive-frame'

let toParent: ReturnType<typeof vi.spyOn>

/**
 * Happy DOM does not run scripts inside iframes, so the injected integration
 * is evaluated against the frame window by hand, the way the browser runs it.
 */
function mountArticle(
  html: string,
  bodyHeight = 0,
  prepare?: (view: Window) => void,
  storage: HostStorage = DEFAULT_HOST_STORAGE,
  size?: FrameSize
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
    interactiveFrameSource(storage, size)
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
    expect(html.indexOf(interactiveFrameSource())).toBeLessThan(
      html.indexOf('Content-Security-Policy')
    )
  })

  /** The getters a sandboxed frame really has: storage throws on access. */
  function sandboxStorage(view: Window) {
    const throwing = () => {
      throw new DOMException('Sandboxed', 'SecurityError')
    }
    for (const name of ['caches', 'localStorage', 'sessionStorage']) {
      Object.defineProperty(view, name, { configurable: true, get: throwing })
    }
    Object.defineProperty(view.navigator, 'serviceWorker', {
      configurable: true,
      get: throwing,
    })
    Object.defineProperty(view, 'indexedDB', {
      configurable: true,
      value: { native: true },
    })
  }

  const BLOCKED: HostStorage = {
    cookies: false,
    cookieEnabled: false,
    localStorage: false,
    sessionStorage: false,
    indexedDB: false,
    caches: false,
    serviceWorker: false,
  }

  it('gives working in-memory storage when the site allows it', () => {
    const { view, article } = mountArticle('<p>Article</p>', 0, sandboxStorage)
    for (const name of ['localStorage', 'sessionStorage'] as const) {
      const storage = view[name]
      storage.setItem('a', '1')
      ;(storage as unknown as Record<string, string>).b = '2'
      expect(storage.getItem('a')).toBe('1')
      expect(storage.getItem('b')).toBe('2')
      expect(storage.length).toBe(2)
      expect(storage.key(0)).toBe('a')
      expect(Object.keys(storage)).toEqual(['a', 'b'])
      storage.removeItem('a')
      expect(storage.getItem('a')).toBeNull()
      storage.clear()
      expect(storage.length).toBe(0)
    }
    view.localStorage.setItem('only', 'local')
    expect(view.sessionStorage.getItem('only')).toBeNull()

    article.cookie = '__test=1; path=/'
    article.cookie = 'other=2'
    expect(article.cookie).toBe('__test=1; other=2')
    article.cookie = '__test=; max-age=0'
    article.cookie = 'other=; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    expect(article.cookie).toBe('')
    expect(view.navigator.cookieEnabled).toBe(true)
    expect(document.cookie).not.toContain('__test')
  })

  it('keeps present storage APIs present and makes their calls fail', async () => {
    const { view } = mountArticle('<p>Article</p>', 0, sandboxStorage)
    expect(view.indexedDB).toEqual({ native: true })
    expect(!!view.caches).toBe(true)
    await expect(view.caches.open('x')).rejects.toMatchObject({
      name: 'SecurityError',
    })
    const worker = view.navigator.serviceWorker
    expect(!!worker).toBe(true)
    expect(worker.controller).toBeNull()
    await expect(worker.register('/sw.js')).rejects.toMatchObject({
      name: 'SecurityError',
    })
    expect(() => worker.addEventListener('message', () => {})).not.toThrow()
  })

  it('stands in for IndexedDB when the sandbox hides it', () => {
    const { view } = mountArticle('<p>Article</p>', 0, (view) => {
      sandboxStorage(view)
      Object.defineProperty(view, 'indexedDB', {
        configurable: true,
        get() {
          throw new DOMException('Sandboxed', 'SecurityError')
        },
      })
    })
    expect(!!view.indexedDB).toBe(true)
    expect(() => view.indexedDB.open('x')).toThrow(
      expect.objectContaining({ name: 'SecurityError' })
    )
  })

  it('blocks storage the site blocks, as the article would see on logos.co', () => {
    const { view, article } = mountArticle(
      '<p>Article</p>',
      0,
      sandboxStorage,
      BLOCKED
    )
    expect(() => view.localStorage).toThrow(
      expect.objectContaining({ name: 'SecurityError' })
    )
    expect(() => view.sessionStorage).toThrow(
      expect.objectContaining({ name: 'SecurityError' })
    )
    article.cookie = '__test=1'
    expect(article.cookie).toBe('')
    expect(view.navigator.cookieEnabled).toBe(false)
    expect(view.indexedDB).toBeUndefined()
    expect(view.caches).toBeUndefined()
    expect(view.navigator.serviceWorker).toBeUndefined()
  })

  it('reports cookieEnabled as the site does, even when writes are blocked', () => {
    const { view, article } = mountArticle(
      '<p>Article</p>',
      0,
      sandboxStorage,
      {
        ...BLOCKED,
        cookieEnabled: true,
      }
    )
    article.cookie = '__test=1'
    expect(article.cookie).toBe('')
    expect(view.navigator.cookieEnabled).toBe(true)
  })

  /** A frame whose process has not received its size yet. */
  function unsized(width = 0, height = 0) {
    return (view: Window) => {
      for (const [name, value] of [
        ['innerWidth', () => width],
        ['innerHeight', () => height],
      ] as const) {
        Object.defineProperty(view, name, {
          configurable: true,
          enumerable: true,
          get: value,
        })
      }
    }
  }

  it('reports the measured frame size until the real size arrives', () => {
    let width = 0
    const { view } = mountArticle(
      '<p>Article</p>',
      0,
      (view) =>
        Object.defineProperties(view, {
          innerWidth: { configurable: true, get: () => width },
          innerHeight: { configurable: true, get: () => 0 },
        }),
      DEFAULT_HOST_STORAGE,
      { width: 700, height: 480 }
    )
    expect([view.innerWidth, view.innerHeight]).toEqual([700, 480])
    width = 1024
    expect(view.innerWidth).toBe(1024)
  })

  it('leaves the frame size alone when nothing was measured', () => {
    const { view } = mountArticle('<p>Article</p>', 0, unsized())
    expect([view.innerWidth, view.innerHeight]).toEqual([0, 0])
    const sized = mountArticle(
      '<p>Article</p>',
      0,
      unsized(320, 200),
      DEFAULT_HOST_STORAGE,
      { width: 700, height: 480 }
    ).view
    expect([sized.innerWidth, sized.innerHeight]).toEqual([320, 200])
  })

  it('embeds only numbers for the measured size', () => {
    const source = interactiveFrameSource(DEFAULT_HOST_STORAGE, {
      width: 700.4,
      height: '480</script>',
    } as unknown as FrameSize)
    expect(source).not.toContain('</script>')
    expect(
      interactiveFrameSource(DEFAULT_HOST_STORAGE, {
        width: 700.4,
        height: 480,
      })
    ).toContain('{"innerWidth":700,"innerHeight":480}')
  })

  it('embeds only the storage flags in the frame script', () => {
    const source = interactiveFrameSource({
      ...DEFAULT_HOST_STORAGE,
      caches: false,
      extra: '</script>',
    } as unknown as HostStorage)
    expect(source).toContain(
      '{"cookies":true,"cookieEnabled":true,"localStorage":true,"sessionStorage":true,"indexedDB":true,"caches":false,"serviceWorker":true}'
    )
    expect(source).not.toContain('</script>')
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

  it('never lets the frame scroll sideways, even when the article asks to', () => {
    const { article } = mountArticle(
      `<!doctype html><html style="overflow-x: scroll !important"><head></head><body></body></html>`
    )
    const root = article.documentElement
    expect(root.style.getPropertyValue('overflow-x')).toBe('hidden')
    expect(root.style.getPropertyPriority('overflow-x')).toBe('important')
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
