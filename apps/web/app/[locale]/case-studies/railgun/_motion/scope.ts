export function createMotionScope(root: HTMLElement) {
  const controller = new AbortController()
  const { signal } = controller
  const cleanups: (() => void)[] = []

  function select<T extends Element = HTMLElement>(selector: string) {
    const element = root.querySelector<T>(selector)
    if (!element) throw new Error(`Missing Railgun motion element ${selector}`)
    return element
  }

  function all<T extends Element = HTMLElement>(selector: string) {
    return Array.from(root.querySelectorAll<T>(selector))
  }

  function timeout(callback: () => void, delay: number) {
    const id = window.setTimeout(() => {
      if (!signal.aborted) callback()
    }, delay)
    return id
  }

  function frame(callback: FrameRequestCallback) {
    return requestAnimationFrame((now) => {
      if (!signal.aborted) callback(now)
    })
  }

  function afterPaint(callback: () => void) {
    frame(() => frame(callback))
  }

  function observe(
    callback: IntersectionObserverCallback,
    options?: IntersectionObserverInit
  ) {
    const observer = new IntersectionObserver(callback, options)
    cleanups.push(() => observer.disconnect())
    return observer
  }

  return {
    root,
    select,
    all,
    signal,
    timeout,
    frame,
    afterPaint,
    observe,
    onCleanup: (callback: () => void) => cleanups.push(callback),
    reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
    dispose() {
      controller.abort()
      for (const cleanup of cleanups.reverse()) cleanup()
      for (const animation of root.getAnimations({ subtree: true }))
        animation.cancel()
      document.body.classList.remove('railgun-lock')
    },
  }
}

export type MotionScope = ReturnType<typeof createMotionScope>
export const compactLayout = () => matchMedia('(max-width: 820px)').matches
export const clamp = (n: number) => Math.max(0, Math.min(1, n))
export const easeOut = (n: number) => 1 - (1 - n) ** 4

export function readLabels(element: HTMLElement, key: string): string[] {
  return JSON.parse(element.dataset[key] ?? '[]') as string[]
}

export function svgElement<K extends keyof SVGElementTagNameMap>(
  parent: SVGElement,
  tag: K,
  attributes: Record<string, string | number>
) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag)
  for (const [name, value] of Object.entries(attributes))
    node.setAttribute(name, String(value))
  parent.append(node)
  return node
}
