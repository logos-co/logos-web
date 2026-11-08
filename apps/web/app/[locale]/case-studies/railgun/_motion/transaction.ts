import { clamp, compactLayout, readLabels, type MotionScope } from './scope'
import { mountTransactionDiagram } from './transaction-diagram'

export function mountTransaction(scope: MotionScope) {
  const { all, select, signal, reduced } = scope
  const tabs = all<HTMLButtonElement>('.tab')
  const panes = all('.pane')
  const track = select('#howtrack')
  const grid = select('#howgrid')
  const caption = select('#dcap')
  const nextLabel = select('#nextlab')
  const labels = readLabels(caption, 'captions')
  const setDiagramStep = mountTransactionDiagram(scope)
  let pinned = false
  let current = -1
  let visible = 0
  let swapTimer = 0
  let captionTimer = 0
  let pinTop = 0
  let run = 0

  const fillTabs = (step: number, progress: number) => {
    tabs.forEach((tab, index) => {
      tab.style.setProperty(
        '--f',
        String(index < step ? 1 : index === step ? progress : 0)
      )
    })
  }

  function update(step: number) {
    if (step === current) return
    current = step
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === step))
      tab.tabIndex = i === step ? 0 : -1
    })
    const next = tabs[step + 1]?.querySelector('.nm')?.textContent ?? ''
    nextLabel.textContent = next
      ? (nextLabel.dataset.next?.replace('{step}', next) ?? next)
      : (nextLabel.dataset.back ?? '')
    setDiagramStep(step)
    if (!pinned) fillTabs(step, 1)
    window.clearTimeout(swapTimer)
    window.clearTimeout(captionTimer)

    const incoming = panes[step]
    const outgoing = panes[visible]
    if (reduced || incoming === outgoing) {
      panes.forEach((pane, i) => {
        pane.hidden = i !== step
        pane.className = 'pane'
      })
      visible = step
    } else {
      outgoing.className = 'pane leave'
      swapTimer = scope.timeout(() => {
        outgoing.hidden = true
        outgoing.className = 'pane'
        incoming.hidden = false
        incoming.className = 'pane enter'
        visible = step
        scope.afterPaint(() => {
          if (current === step) incoming.classList.add('go')
        })
      }, 120)
    }

    if (reduced) {
      caption.textContent = labels[step]
      return
    }
    caption.className = 'dcap out'
    captionTimer = scope.timeout(() => {
      caption.textContent = labels[step]
      caption.className = 'dcap pre'
      scope.afterPaint(() => {
        if (current === step) caption.className = 'dcap in'
      })
    }, 140)
  }

  function layout() {
    track.classList.remove('pin')
    const height = grid.offsetHeight
    pinned = !reduced && !compactLayout() && height + 84 <= innerHeight
    if (!pinned) {
      fillTabs(current, 1)
      return
    }
    pinTop = Math.max(60, Math.round((innerHeight - height) / 2 + 24))
    run = Math.round(innerHeight * 0.45) * tabs.length
    track.style.setProperty('--gh', `${height}px`)
    track.style.setProperty('--run', `${run}px`)
    track.style.setProperty('--pt', `${pinTop}px`)
    track.classList.add('pin')
  }

  function onScroll() {
    if (!pinned) return
    const progress =
      Math.min(
        0.9999,
        clamp((pinTop - track.getBoundingClientRect().top) / run)
      ) * tabs.length
    const step = Math.floor(progress)
    fillTabs(step, Number((progress - step).toFixed(3)))
    update(step)
  }

  function goTo(target: number) {
    const step = (target + tabs.length) % tabs.length
    if (pinned) {
      scrollTo({
        top:
          track.getBoundingClientRect().top +
          scrollY -
          pinTop +
          (run * (step + 0.02)) / tabs.length,
        behavior: 'smooth',
      })
    } else {
      update(step)
    }
    return step
  }

  tabs.forEach((tab, i) =>
    tab.addEventListener('click', () => goTo(i), { signal })
  )
  select('.tabs').addEventListener(
    'keydown',
    (event) => {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return
      event.preventDefault()
      const step = goTo(current + (event.key === 'ArrowRight' ? 1 : -1))
      tabs[step].focus({ preventScroll: true })
    },
    { signal }
  )
  select('#nextstep').addEventListener('click', () => goTo(current + 1), {
    signal,
  })
  update(0)

  return { layout, onScroll }
}
