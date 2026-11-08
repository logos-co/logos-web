import { compactLayout, type MotionScope } from './scope'

export function mountNavigation(scope: MotionScope) {
  const { all, select, signal, reduced, root } = scope
  const menu = select('#menu')
  const menuButtons = all<HTMLButtonElement>('#menubtn, #posmenu')
  const closeMenuButton = select<HTMLButtonElement>('#menuclose')
  const next = select<HTMLButtonElement>('#nextlink')
  const nextPage = select('#nextpage')
  const nextHeading = select('#nphead')
  const back = select<HTMLButtonElement>('#back')
  const header = select('#topnav')
  const hero = select('.hero')
  const index = select('#index')
  const indicator = select('#ind')
  const links = all<HTMLAnchorElement>('#index a')
  const sections = links.map((link) => select(link.hash))
  let opener = menuButtons[0]
  let phase: 'none' | 'menu' | 'opening' | 'next' | 'closing' = 'none'

  function lock(active: boolean) {
    document.body.classList.toggle('railgun-lock', active)
  }

  function showOverlay(element: HTMLElement, visible: boolean) {
    element.inert = !visible
    element.setAttribute('aria-hidden', String(!visible))
    element.classList.toggle('open', visible)
  }

  function openMenu(button: HTMLButtonElement) {
    if (phase !== 'none') return
    phase = 'menu'
    opener = button
    showOverlay(menu, true)
    menuButtons.forEach((control) =>
      control.setAttribute('aria-expanded', 'true')
    )
    lock(true)
    scope.timeout(
      () => {
        if (phase === 'menu') closeMenuButton.focus()
      },
      reduced ? 0 : 200
    )
  }

  function closeMenu(target?: HTMLElement) {
    if (phase !== 'menu') return
    phase = 'none'
    showOverlay(menu, false)
    menuButtons.forEach((control) =>
      control.setAttribute('aria-expanded', 'false')
    )
    lock(false)
    if (target)
      scope.timeout(
        () => target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' }),
        reduced ? 0 : 180
      )
    else opener.focus({ preventScroll: true })
  }

  async function openNext() {
    if (phase !== 'none') return
    phase = 'opening'
    const name = select('#nextlink .name')
    const origin = name.getBoundingClientRect()
    const top = Math.round(next.getBoundingClientRect().top)
    nextPage.style.setProperty('--y', `${top}px`)
    if (reduced) {
      phase = 'next'
      showOverlay(nextPage, true)
      lock(true)
      back.focus()
      return
    }

    next.classList.add('go')
    const line = document.createElement('i')
    line.className = 'flash-line'
    line.setAttribute('aria-hidden', 'true')
    line.style.top = `${top}px`
    root.append(line)
    await line
      .animate([{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], {
        duration: 380,
        easing: 'cubic-bezier(.65,0,.35,1)',
        fill: 'forwards',
      })
      .finished.catch(() => {})
    if (signal.aborted) return
    phase = 'next'
    showOverlay(nextPage, true)
    lock(true)

    nextHeading.style.opacity = '0'
    const destination = nextHeading.getBoundingClientRect()
    const ghost = document.createElement('p')
    ghost.className = 'ghost'
    ghost.setAttribute('aria-hidden', 'true')
    ghost.textContent = name.textContent
    const size = getComputedStyle(name).fontSize
    ghost.style.fontSize = size
    ghost.style.left = `${origin.left}px`
    ghost.style.top = `${origin.top}px`
    root.append(ghost)
    const scale =
      parseFloat(getComputedStyle(nextHeading).fontSize) / parseFloat(size)
    void ghost
      .animate(
        [
          { transform: 'translate(0,0) scale(1)' },
          {
            transform: `translate(${destination.left - origin.left}px,${destination.top - origin.top}px) scale(${scale})`,
          },
        ],
        { duration: 700, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'forwards' }
      )
      .finished.catch(() => {})
      .then(() => {
        nextHeading.style.removeProperty('opacity')
        ghost.remove()
      })
    void line
      .animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 240,
        delay: 200,
        fill: 'forwards',
      })
      .finished.catch(() => {})
      .then(() => line.remove())
    scope.timeout(() => {
      if (phase === 'next') back.focus()
    }, 560)
  }

  function closeNext() {
    if (phase !== 'next') return
    phase = 'closing'
    if (!reduced) nextPage.classList.add('closing')
    showOverlay(nextPage, false)
    scope.timeout(
      () => {
        phase = 'none'
        nextPage.classList.remove('closing')
        lock(false)
        next.classList.remove('go')
        next.focus({ preventScroll: true })
      },
      reduced ? 0 : 360
    )
  }

  menuButtons.forEach((button) =>
    button.addEventListener('click', () => openMenu(button), { signal })
  )
  closeMenuButton.addEventListener('click', () => closeMenu(), { signal })
  all<HTMLButtonElement>('#menu [data-target]').forEach((button) => {
    const target = select(button.dataset.target ?? '')
    button.addEventListener('click', () => closeMenu(target), { signal })
  })
  next.addEventListener('click', openNext, { signal })
  back.addEventListener('click', closeNext, { signal })

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') {
        if (phase === 'menu') closeMenu()
        else closeNext()
      }
      if (event.key !== 'Tab' || (phase !== 'menu' && phase !== 'next')) return
      const overlay = phase === 'menu' ? menu : nextPage
      const controls = Array.from(
        overlay.querySelectorAll<HTMLElement>('button, a[href]')
      )
      const first = controls[0]
      const last = controls.at(-1)
      const focus = document.activeElement
      if ((!overlay.contains(focus) || focus === last) && !event.shiftKey) {
        event.preventDefault()
        first.focus()
      } else if (
        (!overlay.contains(focus) || focus === first) &&
        event.shiftKey
      ) {
        event.preventDefault()
        last?.focus()
      }
    },
    { signal }
  )

  return function onScroll() {
    const shown = scrollY > hero.offsetHeight * 0.9
    header.classList.toggle('show', shown)
    header.inert = !shown

    let active = -1
    sections.forEach((section, i) => {
      if (section.getBoundingClientRect().top < innerHeight * 0.4) active = i
    })
    links.forEach((link, i) => {
      link.classList.toggle('on', i === active)
      if (i === active) link.setAttribute('aria-current', 'location')
      else link.removeAttribute('aria-current')
    })
    const link = links[active]
    indicator.style.opacity = link && !compactLayout() ? '1' : '0'
    if (!link || compactLayout()) return
    const rect = link.getBoundingClientRect()
    indicator.style.transform = `translateX(${rect.left - index.getBoundingClientRect().left}px) scaleX(${rect.width})`
  }
}
