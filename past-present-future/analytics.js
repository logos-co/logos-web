;(() => {
  const trackableSelector =
    'button, [role="button"], [role="link"], a, .button, .choices-scope .face'

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

    if (element.classList.contains('face')) {
      const character = normalizeLabel(
        element.querySelector('.face-name')?.textContent
      )

      return character ? `Select ${character}` : ''
    }

    if (element.classList.contains('copt')) {
      const key = normalizeLabel(element.querySelector('.ckey')?.textContent)
      const choice = normalizeLabel(
        element.querySelector('.clabel')?.textContent
      )

      if (key && choice) {
        return `Choose ${key} (${choice})`
      }

      return key ? `Choose ${key}` : choice ? `Choose - ${choice}` : 'Choose'
    }

    if (element.id === 'mute') {
      return normalizeLabel(element.getAttribute('aria-label'))
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

    if (window.location.pathname.includes('/choices/mike')) {
      return 'Mike Experience'
    }

    if (element.closest('.choices-scope')) {
      return "Life's Choices"
    }

    if (element.classList.contains('mm-room')) {
      return 'Museum navigation'
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
    const character = normalizeLabel(
      element.querySelector('.face-name')?.textContent
    )
    const path = normalizeLabel(
      element.querySelector('.face-path')?.textContent
    )
    const choiceRoot = element.closest('#choice')
    const choice = normalizeLabel(element.querySelector('.clabel')?.textContent)
    const choiceKey = normalizeLabel(
      element.querySelector('.ckey')?.textContent
    )
    const age = normalizeLabel(choiceRoot?.querySelector('.c-age')?.textContent)
    const scene = normalizeLabel(
      choiceRoot?.querySelector('.c-title')?.textContent
    )

    return {
      ...data,
      ...(context ? { context } : {}),
      ...(exhibit ? { exhibit: normalizeLabel(exhibit.textContent) } : {}),
      ...(character ? { character } : {}),
      ...(path ? { path } : {}),
      ...(element.classList.contains('face')
        ? { available: !element.classList.contains('soon') }
        : {}),
      ...(choice ? { choice } : {}),
      ...(choiceKey ? { choiceKey } : {}),
      ...(age ? { age } : {}),
      ...(scene ? { scene } : {}),
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
