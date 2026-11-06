import { describe, expect, it, vi } from 'vitest'

import {
  FRAME_HEIGHT_MESSAGE,
  FRAME_NAVIGATE_MESSAGE,
  FRAME_SYNC_MESSAGE,
  INTERACTIVE_FRAME_SANDBOX,
  observeInteractiveFrame,
} from '../media-interactive-frame'

function createFrame() {
  const contentWindow = { postMessage: vi.fn() }
  const location = {
    href: 'https://logos.co/media/article/example',
    origin: 'https://logos.co',
    assign: vi.fn(),
  }
  const host = Object.assign(new EventTarget(), { location })
  const iframe = Object.assign(new EventTarget(), {
    contentWindow,
    ownerDocument: { defaultView: host },
  })
  const onHeight = vi.fn()
  const connect = (fixedHeight = false) =>
    observeInteractiveFrame(
      iframe as unknown as HTMLIFrameElement,
      fixedHeight ? undefined : onHeight
    )
  const post = (data: unknown, source: unknown = contentWindow) =>
    host.dispatchEvent(Object.assign(new Event('message'), { data, source }))
  return { contentWindow, location, iframe, onHeight, connect, post }
}

describe('interactive frame observation', () => {
  it('keeps embed scripts off the site origin', () => {
    expect(INTERACTIVE_FRAME_SANDBOX).toContain('allow-scripts')
    expect(INTERACTIVE_FRAME_SANDBOX).not.toContain('allow-same-origin')
    expect(INTERACTIVE_FRAME_SANDBOX).not.toContain('allow-top-navigation')
  })

  it('asks the frame for its height on connect and on every load', () => {
    const { connect, contentWindow, iframe } = createFrame()
    const disconnect = connect()
    expect(contentWindow.postMessage).toHaveBeenCalledWith(
      { type: FRAME_SYNC_MESSAGE },
      '*'
    )
    iframe.dispatchEvent(new Event('load'))
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(2)
    disconnect()
  })

  it('accepts heights only from its own frame and bounds them', () => {
    const { connect, post, onHeight } = createFrame()
    const disconnect = connect()
    post({ type: FRAME_HEIGHT_MESSAGE, height: 632.2 })
    expect(onHeight).toHaveBeenLastCalledWith(633)
    post({ type: FRAME_HEIGHT_MESSAGE, height: 15000 })
    expect(onHeight).toHaveBeenLastCalledWith(15000)
    post({ type: FRAME_HEIGHT_MESSAGE, height: 1e9 })
    expect(onHeight).toHaveBeenLastCalledWith(100000)
    onHeight.mockClear()
    post({ type: FRAME_HEIGHT_MESSAGE, height: 500 }, {})
    post({ type: FRAME_HEIGHT_MESSAGE, height: '500' })
    post({ type: FRAME_HEIGHT_MESSAGE, height: Number.NaN })
    post('height')
    expect(onHeight).not.toHaveBeenCalled()
    disconnect()
  })

  it('ignores heights when the embed has a fixed height', () => {
    const { connect, post, onHeight } = createFrame()
    const disconnect = connect(true)
    post({ type: FRAME_HEIGHT_MESSAGE, height: 500 })
    expect(onHeight).not.toHaveBeenCalled()
    disconnect()
  })

  it('follows site paths and nothing else', () => {
    const { connect, post, location } = createFrame()
    const disconnect = connect()
    post({ type: FRAME_NAVIGATE_MESSAGE, href: '/media/articles?page=2#top' })
    expect(location.assign).toHaveBeenCalledWith('/media/articles?page=2#top')
    location.assign.mockClear()
    for (const href of [
      '//evil.example',
      '/\\evil.example',
      'https://evil.example/',
      'javascript:alert(1)',
      'media',
      42,
    ]) {
      post({ type: FRAME_NAVIGATE_MESSAGE, href })
    }
    post({ type: FRAME_NAVIGATE_MESSAGE, href: '/media' }, {})
    expect(location.assign).not.toHaveBeenCalled()
    disconnect()
  })

  it('stops listening on cleanup', () => {
    const { connect, post, iframe, onHeight, location, contentWindow } =
      createFrame()
    connect()()
    contentWindow.postMessage.mockClear()
    post({ type: FRAME_HEIGHT_MESSAGE, height: 500 })
    post({ type: FRAME_NAVIGATE_MESSAGE, href: '/media' })
    iframe.dispatchEvent(new Event('load'))
    expect(onHeight).not.toHaveBeenCalled()
    expect(location.assign).not.toHaveBeenCalled()
    expect(contentWindow.postMessage).not.toHaveBeenCalled()
  })
})
