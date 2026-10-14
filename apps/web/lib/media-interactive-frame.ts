export function observeInteractiveFrame(
  iframe: HTMLIFrameElement,
  onHeight?: (height: number) => void
): () => void {
  let disconnectDocument = () => {}

  function connectDocument() {
    disconnectDocument()
    const document = iframe.contentDocument
    if (!document?.body || !document.defaultView) return
    const view = document.defaultView
    const body = document.body

    // Run in the parent so an article's CSP cannot block the integration.
    for (const root of [document.documentElement, body]) {
      root.style.setProperty('background', 'transparent', 'important')
    }
    for (const link of document.querySelectorAll<HTMLAnchorElement>(
      'a[href]'
    )) {
      // prepareCmsLinks has already chosen the target. Keep authored rel tokens.
      if (link.target.toLowerCase() === '_blank') {
        link.relList.add('noopener', 'noreferrer')
      }
    }

    function navigateSiteLink(event: MouseEvent) {
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      )
        return
      const link = (
        event.target as Element | null
      )?.closest?.<HTMLAnchorElement>('a[href]')
      if (!link || link.hasAttribute('download')) return
      const href = link.getAttribute('href')!
      if (
        !/^\/(?!\/)/.test(href) ||
        (link.target && link.target.toLowerCase() !== '_self')
      )
        return
      // Site routes belong in the containing page, not inside the article frame.
      event.preventDefault()
      iframe.ownerDocument.defaultView?.location.assign(href)
    }
    document.addEventListener('click', navigateSiteLink)

    let active = true
    let lastHeight = -1
    function updateHeight() {
      if (!active || !onHeight) return
      const rect = body.getBoundingClientRect()
      const marginBottom =
        parseFloat(view.getComputedStyle(body).marginBottom) || 0
      // The root scrollHeight includes the iframe viewport and cannot shrink.
      const height = Math.ceil(
        rect.top +
          view.scrollY +
          Math.max(rect.height, body.scrollHeight) +
          marginBottom
      )
      if (height <= 0 || height === lastHeight) return
      lastHeight = height
      onHeight(height)
    }

    const mutations = new MutationObserver(updateHeight)
    const resize = new ResizeObserver(updateHeight)
    mutations.observe(body, {
      childList: true,
      subtree: true,
      attributes: true,
      characterData: true,
    })
    resize.observe(body)
    view.addEventListener('resize', updateHeight)
    document.addEventListener('load', updateHeight, true)
    document.fonts?.ready.then(updateHeight)
    updateHeight()

    disconnectDocument = () => {
      active = false
      mutations.disconnect()
      resize.disconnect()
      view.removeEventListener('resize', updateHeight)
      document.removeEventListener('load', updateHeight, true)
      document.removeEventListener('click', navigateSiteLink)
    }
  }

  iframe.addEventListener('load', connectDocument)
  if (iframe.contentDocument?.readyState === 'complete') connectDocument()
  return () => {
    iframe.removeEventListener('load', connectDocument)
    disconnectDocument()
  }
}
