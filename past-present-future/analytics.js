;(() => {
  const trackableSelector = 'button, [role="button"], a, .button'

  const normalizeLabel = (value) =>
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

  const getVisibleLabel = (element) =>
    normalizeLabel(element.textContent).replace(/^\+\s*/, '')

  const getBaseEventName = (element) => {
    if (element.classList.contains('mx-more')) {
      return 'Enter exhibit'
    }

    if (element.classList.contains('wm-back')) {
      return 'Close exhibit'
    }

    return (
      normalizeLabel(element.getAttribute('data-umami-event-name')) ||
      normalizeLabel(element.id) ||
      getVisibleLabel(element) ||
      normalizeLabel(element.getAttribute('aria-label')) ||
      normalizeLabel(element.getAttribute('name')) ||
      normalizeLabel(element.getAttribute('title')) ||
      ''
    )
  }

  const getHallContext = (element) => {
    const contextRoot = element.closest('section[data-kind], [role="dialog"]')
    const hallText = contextRoot?.querySelector(
      '.mx-hall, .mx-title, .wm-head'
    )?.textContent

    return normalizeLabel(hallText).match(/\bHall\s+[IVX]+\b/)?.[0] || ''
  }

  const getEventContext = (element) => {
    const hall = getHallContext(element)

    if (hall) {
      return hall
    }

    if (element.classList.contains('scrollcue')) {
      return 'Museum hero'
    }

    if (
      element.classList.contains('hd-btn') ||
      element.classList.contains('hd-min')
    ) {
      return 'Museum navigation'
    }

    if (element.classList.contains('loader-cta')) {
      return 'Museum footer'
    }

    if (element.classList.contains('nav-item')) {
      return 'Desktop navigation'
    }

    if (element.classList.contains('sheet-item')) {
      return 'Mobile navigation'
    }

    if (element.classList.contains('tl-label')) {
      return 'Timeline'
    }

    return ''
  }

  const getEventName = (element) => {
    const name = getBaseEventName(element)

    if (!name) {
      return ''
    }

    const context = getEventContext(element)

    return context ? `${name} - ${context}` : name
  }

  const getEventData = (element) => {
    const data = { source: window.location.pathname }
    const context = getEventContext(element)
    const exhibit = element
      .closest('[data-kind="main"], [role="dialog"]')
      ?.querySelector('.mx-title, #wm-title')

    return {
      ...data,
      ...(context ? { context } : {}),
      ...(exhibit ? { exhibit: normalizeLabel(exhibit.textContent) } : {}),
    }
  }

  document.addEventListener('click', (event) => {
    if (!(event.target instanceof Element)) {
      return
    }

    const element = event.target.closest(trackableSelector)

    if (
      !element ||
      element.matches(':disabled') ||
      element.classList.contains('disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      element.getAttribute('data-umami-button-tracking') === 'off' ||
      element.closest('[data-umami-button-tracking="off"]')
    ) {
      return
    }

    const eventName = getEventName(element)

    if (!eventName) {
      return
    }

    window.umami?.track(eventName, getEventData(element))
  })
})()
