import { runInNewContext } from 'node:vm'
import { describe, expect, it, vi } from 'vitest'

import { buildInteractiveDocument } from '../media-interactive-document'

const frameId = 'article-embed'

function runHeightReporter() {
  const bounds = { top: 12, height: 600 }
  const body = {
    getBoundingClientRect: () => bounds,
    get scrollHeight() {
      return bounds.height
    },
  }
  const postMessage = vi.fn()
  const parent = { postMessage }
  const listeners = new Map<string, (event?: unknown) => void>()
  const observers: Array<() => void> = []
  class Observer {
    constructor(callback: () => void) {
      observers.push(callback)
    }
    observe() {}
  }
  const html = buildInteractiveDocument('<p>Article</p>', frameId)
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)]
  runInNewContext(scripts.at(-1)![1], {
    document: { body, addEventListener: vi.fn() },
    window: {
      scrollY: 0,
      addEventListener: (name: string, callback: (event?: unknown) => void) =>
        listeners.set(name, callback),
    },
    parent,
    getComputedStyle: () => ({ marginBottom: '20px' }),
    MutationObserver: Observer,
    ResizeObserver: Observer,
  })
  return { bounds, postMessage, parent, listeners, observers }
}

describe('buildInteractiveDocument', () => {
  it('preserves a full document and its body attributes, styles and scripts', () => {
    const fullHtml =
      '<!doctype html><html lang="en"><head><style>body{font-family:Georgia}</style></head><body class="article" style="padding:24px"><h1>Article</h1><script>window.articleReady=true</script></body></html>'
    const html = buildInteractiveDocument(fullHtml, frameId)

    expect(html).toContain('<html lang="en">')
    expect(html).toContain('<style>body{font-family:Georgia}</style>')
    expect(html).toContain('<body class="article" style="padding:24px">')
    expect(html).toContain('<script>window.articleReady=true</script>')
    expect(html.match(/<body\b/g)).toHaveLength(1)
    expect(html).toContain('http-equiv="Content-Security-Policy"')
  })

  it('retains an explicit document CSP', () => {
    const csp =
      '<meta http-equiv="Content-Security-Policy" content="default-src https:">'
    const html = buildInteractiveDocument(
      `<html><head>${csp}</head><body>Article</body></html>`,
      frameId
    )
    expect(html.match(/Content-Security-Policy/g)).toHaveLength(1)
    expect(html).toContain(csp)
  })

  it('keeps legacy blog links pointing at the migrated article', () => {
    const html = buildInteractiveDocument(
      '<a href="https://blog.logos.co/article/example">Read</a><a href="#notes">Notes</a>',
      frameId
    )
    expect(html).toContain('href="/media/article/example"')
    expect(html).toContain('href="#notes"')
  })
})

describe('interactive document height reporting', () => {
  it('includes body offsets and margins, then shrinks when content gets shorter', () => {
    const { bounds, postMessage, observers } = runHeightReporter()
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'logos-media-embed-height', frameId, height: 632 },
      '*'
    )
    bounds.height = 300
    observers.forEach((notify) => notify())
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'logos-media-embed-height', frameId, height: 332 },
      '*'
    )
  })

  it('reports the full height of long articles', () => {
    const { bounds, listeners, postMessage } = runHeightReporter()
    bounds.height = 15000
    listeners.get('resize')!()
    expect(postMessage).toHaveBeenLastCalledWith(
      { type: 'logos-media-embed-height', frameId, height: 15032 },
      '*'
    )
  })

  it('resends unchanged height on a parent request if the initial message was missed', () => {
    const { parent, listeners, postMessage } = runHeightReporter()
    postMessage.mockClear()
    const data = { type: 'logos-media-embed-request-height', frameId }
    listeners.get('message')!({ source: {}, data })
    expect(postMessage).not.toHaveBeenCalled()
    listeners.get('message')!({ source: parent, data })
    expect(postMessage).toHaveBeenCalledOnce()
  })
})
