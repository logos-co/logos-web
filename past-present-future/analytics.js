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

    return (
      normalizeLabel(element.getAttribute('data-umami-event-name')) ||
      normalizeLabel(element.id) ||
      getVisibleLabel(element) ||
      normalizeLabel(element.getAttribute('aria-label')) ||
      normalizeLabel(element.getAttribute('name')) ||
      normalizeLabel(element.getAttribute('title')) ||
      'button'
    )
  }

  const getHallContext = (element) => {
    const section = element.closest('section[data-kind]')
    const hallText = section?.querySelector('.mx-hall, .mx-title')?.textContent

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
    const context = getEventContext(element)

    return context ? `${name} - ${context}` : name
  }

  const getEventData = (element) => {
    const data = { source: window.location.pathname }
    const context = getEventContext(element)
    const exhibit = element
      .closest('[data-kind="main"]')
      ?.querySelector('.mx-title')

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

    window.umami?.track(getEventName(element), getEventData(element))
  })
})()
