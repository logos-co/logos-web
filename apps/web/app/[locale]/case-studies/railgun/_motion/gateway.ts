import type { MotionScope } from './scope'

export function mountGateway(scope: MotionScope) {
  const { select, signal, reduced, root } = scope
  const next = select<HTMLButtonElement>('#nextlink')
  const nextPage = select('#nextpage')
  const nextHeading = select('#nphead')
  const back = select<HTMLButtonElement>('#back')
  let phase: 'none' | 'opening' | 'next' | 'closing' = 'none'

  function lock(active: boolean) {
    document.body.classList.toggle('railgun-lock', active)
  }

  function showOverlay(visible: boolean) {
    nextPage.inert = !visible
    nextPage.setAttribute('aria-hidden', String(!visible))
    nextPage.classList.toggle('open', visible)
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
      showOverlay(true)
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
    showOverlay(true)
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
    showOverlay(false)
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

  next.addEventListener('click', openNext, { signal })
  back.addEventListener('click', closeNext, { signal })

  window.addEventListener(
    'keydown',
    (event) => {
      if (event.key === 'Escape') closeNext()
      if (event.key !== 'Tab' || phase !== 'next') return
      const controls = Array.from(
        nextPage.querySelectorAll<HTMLElement>('button, a[href]')
      )
      const first = controls[0]
      const last = controls.at(-1)
      const focus = document.activeElement
      if ((!nextPage.contains(focus) || focus === last) && !event.shiftKey) {
        event.preventDefault()
        first.focus()
      } else if (
        (!nextPage.contains(focus) || focus === first) &&
        event.shiftKey
      ) {
        event.preventDefault()
        last?.focus()
      }
    },
    { signal }
  )
}
