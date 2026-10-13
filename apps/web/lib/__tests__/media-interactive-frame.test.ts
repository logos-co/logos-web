import { afterEach, describe, expect, it, vi } from 'vitest'

import { observeInteractiveFrame } from '../media-interactive-frame'

function createFrame(readyState = 'complete') {
  const bounds = { top: 12, height: 600 }
  const body = {
    style: { setProperty: vi.fn() },
    getBoundingClientRect: () => bounds,
    get scrollHeight() {
      return bounds.height
    },
  }
  const view = Object.assign(new EventTarget(), {
    scrollY: 0,
    getComputedStyle: () => ({ marginBottom: '20px' }),
  })
  const document = Object.assign(new EventTarget(), {
    body,
    defaultView: view,
    documentElement: { style: { setProperty: vi.fn() } },
    querySelectorAll: () => [],
    readyState,
    fonts: { ready: Promise.resolve() },
  })
  const iframe = Object.assign(new EventTarget(), { contentDocument: document })
  const observers: Array<{
    notify: () => void
    disconnect: ReturnType<typeof vi.fn>
  }> = []
  class Observer {
    disconnect = vi.fn()
    constructor(notify: () => void) {
      observers.push({ notify, disconnect: this.disconnect })
    }
    observe() {}
  }
  vi.stubGlobal('MutationObserver', Observer)
  vi.stubGlobal('ResizeObserver', Observer)
  const onHeight = vi.fn()
  const connect = (
    callback: ((height: number) => void) | undefined = onHeight
  ) => observeInteractiveFrame(iframe as unknown as HTMLIFrameElement, callback)
  return { bounds, document, iframe, onHeight, observers, connect }
}

afterEach(() => vi.unstubAllGlobals())

describe('interactive frame observation', () => {
  it('measures an already loaded document without executing article scripts', () => {
    const { connect, onHeight } = createFrame()
    const disconnect = connect()
    expect(onHeight).toHaveBeenLastCalledWith(632)
    disconnect()
  })

  it('waits for load and reconnects after navigation', () => {
    const { connect, iframe, onHeight, bounds, observers } =
      createFrame('loading')
    const disconnect = connect()
    expect(onHeight).not.toHaveBeenCalled()
    iframe.dispatchEvent(new Event('load'))
    expect(onHeight).toHaveBeenLastCalledWith(632)
    bounds.height = 900
    iframe.dispatchEvent(new Event('load'))
    expect(observers[0]!.disconnect).toHaveBeenCalledOnce()
    expect(onHeight).toHaveBeenLastCalledWith(932)
    disconnect()
  })

  it('handles growth beyond 10000px and shrinkage without repeated updates', () => {
    const { connect, bounds, onHeight, observers } = createFrame()
    const disconnect = connect()
    bounds.height = 15000
    observers.forEach(({ notify }) => notify())
    expect(onHeight).toHaveBeenLastCalledWith(15032)
    bounds.height = 300
    observers.forEach(({ notify }) => notify())
    expect(onHeight).toHaveBeenLastCalledWith(332)
    expect(onHeight).toHaveBeenCalledTimes(3)
    disconnect()
  })

  it('disconnects listeners, observers and pending font updates on cleanup', async () => {
    const { connect, document, iframe, onHeight, observers } = createFrame()
    const disconnect = connect()
    disconnect()
    onHeight.mockClear()
    observers.forEach(({ notify, disconnect: stop }) => {
      expect(stop).toHaveBeenCalledOnce()
      notify()
    })
    document.dispatchEvent(new Event('load'))
    document.defaultView.dispatchEvent(new Event('resize'))
    iframe.dispatchEvent(new Event('load'))
    await Promise.resolve()
    expect(onHeight).not.toHaveBeenCalled()
  })
})
