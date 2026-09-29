;(() => {
  const anchorIdsByHall = Object.freeze({
    d: 'the-control-of-money',
    s: 'the-surveillance-state',
    g: 'the-censored-world',
    c: 'the-failure-of-voice',
    i: 'the-systems-of-control',
  })

  const hallsByAnchorId = Object.fromEntries(
    Object.entries(anchorIdsByHall).map(([hall, anchorId]) => [anchorId, hall])
  )

  const getHallSection = (hall) =>
    document.querySelector(`section.break[data-c="${hall}"]`)

  const assignAnchorIds = () => {
    let assignedCount = 0

    Object.entries(anchorIdsByHall).forEach(([hall, anchorId]) => {
      const section = getHallSection(hall)

      if (section) {
        section.id = anchorId
        assignedCount += 1
      }
    })

    return assignedCount
  }

  const getHallFromHash = () => hallsByAnchorId[window.location.hash.slice(1)]

  const prepareAnchorLinks = () => {
    const root = document.documentElement
    const previousScrollBehavior = root.style.scrollBehavior
    const hashedHall = getHallFromHash()

    if (hashedHall) {
      root.style.scrollBehavior = 'auto'
    }

    const allAnchorsAssigned =
      assignAnchorIds() === Object.keys(anchorIdsByHall).length
    const section =
      allAnchorsAssigned && hashedHall ? getHallSection(hashedHall) : null

    if (!section) {
      root.style.scrollBehavior = previousScrollBehavior
      return allAnchorsAssigned
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const alignSection = () => {
          const distanceFromTarget = section.getBoundingClientRect().top - 84

          if (Math.abs(distanceFromTarget) > 4) {
            window.scrollTo({
              top: window.scrollY + distanceFromTarget,
              behavior: 'instant',
            })
          }
        }

        alignSection()
        window.setTimeout(alignSection, 250)
        window.setTimeout(() => {
          alignSection()
          root.style.scrollBehavior = previousScrollBehavior
        }, 750)
      })
    })

    return allAnchorsAssigned
  }

  const updateHashForHallControl = (event) => {
    if (!(event.target instanceof Element)) {
      return
    }

    const control = event.target.closest('.mm-room[data-w]')
    const anchorId = control
      ? anchorIdsByHall[control.getAttribute('data-w')]
      : null

    if (!anchorId) {
      return
    }

    window.history.replaceState(null, '', `#${anchorId}`)
  }

  const observer = new MutationObserver(() => {
    if (prepareAnchorLinks()) {
      observer.disconnect()
    }
  })

  prepareAnchorLinks()
  observer.observe(document.body, { childList: true, subtree: true })

  window.addEventListener('hashchange', prepareAnchorLinks)
  document.addEventListener('click', updateHashForHallControl)
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      updateHashForHallControl(event)
    }
  })
})()
