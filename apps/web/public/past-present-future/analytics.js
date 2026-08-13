;(() => {
  const trackableSelector = 'button, [role="button"], a, .button'

  const normalizeLabel = (value) =>
    typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : ''

  const getEventName = (element) => {
    if (element.classList.contains('mx-more')) {
      return 'Enter exhibit'
    }

    return (
      normalizeLabel(element.getAttribute('data-umami-event-name')) ||
      normalizeLabel(element.id) ||
      normalizeLabel(element.textContent) ||
      normalizeLabel(element.getAttribute('aria-label')) ||
      normalizeLabel(element.getAttribute('name')) ||
      normalizeLabel(element.getAttribute('title')) ||
      'button'
    )
  }

  const getEventData = (element) => {
    const data = { source: window.location.pathname }
    const exhibit = element
      .closest('[data-kind="main"]')
      ?.querySelector('.mx-title')

    return exhibit
      ? { ...data, exhibit: normalizeLabel(exhibit.textContent) }
      : data
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
