import { compactLayout, svgElement, type MotionScope } from './scope'

import { renderHeroLines } from './hero-lines'

const columnDelays = [0, 70, 170, 300]
const segmentDelays = [0, 620, 1100]
const segmentDurations = [600, 460, 460]

export function mountReveals(scope: MotionScope) {
  const { all, select, reduced } = scope
  const originals = new Map<HTMLElement, Node[]>()
  const lineTargets = all('[data-railgun-lines]')
  const life = select('#life')
  const lifeLine = select<SVGSVGElement>('#lsvg')
  const stages = all('#life .span')
  let lifeDrawn = false

  for (const target of lineTargets)
    originals.set(target, Array.from(target.childNodes))

  function prepareLines(heading: HTMLElement, hero = false) {
    const original = originals.get(heading) ?? []
    heading.replaceChildren(...original)
    const copy = heading.querySelector('.copy-text')
    const visible =
      copy &&
      Array.from(copy.children).find(
        (child) => getComputedStyle(child).display !== 'none'
      )
    const node = (visible || heading).firstChild
    if (!(node instanceof Text)) return
    const lines: string[] = []
    const range = document.createRange()
    let currentTop: number | undefined
    for (const word of node.data.matchAll(/\S+/g)) {
      range.setStart(node, word.index)
      range.setEnd(node, word.index + word[0].length)
      const { top } = range.getBoundingClientRect()
      if (currentTop === undefined || Math.abs(currentTop - top) > 4)
        lines.push(word[0])
      else lines[lines.length - 1] += ` ${word[0]}`
      currentTop = top
    }

    if (hero) {
      renderHeroLines(heading, lines)
      return
    }

    const fragment = document.createDocumentFragment()
    lines.forEach((line, index) => {
      if (index && !lines[index - 1].endsWith('-')) fragment.append(' ')
      const mask = document.createElement('span')
      mask.className = 'al'
      const inner = document.createElement('span')
      inner.style.setProperty('--d', `${index * 90}ms`)
      inner.textContent = line
      mask.append(inner)
      fragment.append(mask)
    })
    heading.replaceChildren(fragment)
  }

  function drawLife(instant: boolean, showCards = true) {
    const width = lifeLine.clientWidth
    const vertical = compactLayout()
    const height = vertical ? lifeLine.clientHeight : 24
    const col = width / 7
    const top = life.getBoundingClientRect().top
    const stops = vertical
      ? all('#life .stages > span').map(
          (stage) => stage.getBoundingClientRect().top - top + 11
        )
      : Array.from({ length: 7 }, (_, i) => i * col + 3.5)
    const end = vertical
      ? stages[2].getBoundingClientRect().bottom - top
      : width
    const segments = vertical
      ? ([
          [stops[0], stops[3], ''],
          [stops[3], stops[5], '8 6'],
          [stops[5], end, '1 5'],
        ] as const)
      : ([
          [3.5, col * 3, ''],
          [col * 3 + 3.5, col * 5, '8 6'],
          [col * 5 + 3.5, end, '1 5'],
        ] as const)
    const animate = !instant && !vertical

    lifeDrawn = true
    lifeLine.replaceChildren()
    lifeLine.setAttribute('viewBox', `0 0 ${width} ${height}`)
    segments.forEach(([from, to, dash], i) => {
      const line = svgElement(lifeLine, 'line', {
        x1: vertical ? 12 : from,
        y1: vertical ? from : 12,
        x2: vertical ? 12 : to,
        y2: vertical ? to : 12,
        stroke: '#152521',
        'stroke-width': 1,
        'stroke-dasharray': dash,
      })
      if (!animate) return
      line.animate(
        [{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0)' }],
        {
          duration: segmentDurations[i],
          delay: segmentDelays[i],
          easing: 'cubic-bezier(.65,0,.35,1)',
          fill: 'backwards',
        }
      )
    })
    stops.forEach((stop, i) => {
      const dot = svgElement(lifeLine, 'circle', {
        cx: vertical ? 12 : stop,
        cy: vertical ? stop : 12,
        r: 3.5,
        fill: i < 5 ? '#152521' : '#DBDDD7',
        stroke: '#152521',
        'stroke-width': 1,
      })
      if (!animate) return
      const delay =
        i <= 3
          ? (i / 3) * 600
          : i <= 5
            ? 620 + (i - 3) * 230
            : 1100 + (i - 5) * 230
      dot.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 80,
        delay,
        fill: 'backwards',
      })
    })
    if (!showCards) return
    stages.forEach((stage, i) => {
      if (!animate) stage.classList.add('on')
      else
        scope.timeout(
          () => stage.classList.add('on'),
          segmentDelays[i] + segmentDurations[i] - 120
        )
    })
  }

  const hero = select('[data-railgun-lines="hero"]')
  const headings = all('[data-railgun-lines="heading"]')

  function resize() {
    prepareLines(hero, true)
    for (const heading of headings) {
      if (heading.classList.contains('ar-h')) prepareLines(heading)
    }
    if (lifeDrawn || compactLayout()) {
      drawLife(
        true,
        !life.classList.contains('arm') || life.classList.contains('on')
      )
    }
  }

  if (reduced) {
    drawLife(true)
    return resize
  }

  const observer = scope.observe(
    (entries, io) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue
        const element = entry.target
        if (element.matches('.stats4')) {
          element.querySelectorAll<HTMLElement>('.stat').forEach((stat, i) => {
            stat.style.setProperty('--d', `${columnDelays[i % 4]}ms`)
          })
        }
        element.classList.add('on')
        if (element === life) drawLife(false)
        io.unobserve(element)
      }
    },
    { rootMargin: '0px 0px -14% 0px' }
  )

  for (const target of all('.rv')) {
    if (target.getBoundingClientRect().top < innerHeight * 0.86) {
      if (target === life) drawLife(true)
    } else {
      target.classList.add('arm')
      observer.observe(target)
    }
  }

  const footerGroups = new Map<HTMLElement, HTMLElement[]>()
  const autoObserver = scope.observe(
    (entries, io) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort(
          (a, b) =>
            a.boundingClientRect.top - b.boundingClientRect.top ||
            a.boundingClientRect.left - b.boundingClientRect.left
        )
      visible.forEach(({ target }, i) => {
        if (target instanceof HTMLElement) {
          const group = footerGroups.get(target) ?? [target]
          for (const item of group) {
            item.style.setProperty('--d0', `${Math.min(i * 80, 560)}ms`)
            item.classList.add('on')
          }
        }
        io.unobserve(target)
      })
    },
    { rootMargin: '0px 0px -10% 0px' }
  )

  document.fonts.ready.then(() => {
    if (scope.signal.aborted) return
    const fold = innerHeight * 0.9
    const eligible = (node: HTMLElement) =>
      !node.closest(
        '.hero, #how .stage, #how .tabs, #how .pane, #fig #cols, .rv, .menu, .topnav, .next'
      ) && node.getBoundingClientRect().top > fold

    for (const heading of headings.filter(eligible)) {
      prepareLines(heading)
      heading.classList.add('ar-h')
      autoObserver.observe(heading)
    }

    for (const element of all(
      'section .body p, section .side p, .cap, .problem, .figcap, section .h4, section > .h3, .card .h3, .split .h3, .tag, .tagb, .mark, .acts'
    )) {
      if (!eligible(element) || element.closest('.ar-c, .ar-h, .ar-f')) continue
      element.classList.add('ar-f')
      autoObserver.observe(element)
    }

    for (const card of all(
      '.card, .bcard, .basics .row, .spans .span, .stages > span, .tl .row, .pill, .chains > *'
    )) {
      if (!eligible(card) || card.parentElement?.closest('.ar-c')) continue
      card.classList.remove('ar-f')
      card.classList.add('ar-c')
      autoObserver.observe(card)
    }

    for (const side of ['left', 'right']) {
      const parts = all(`footer [data-footer-motion="${side}"]`)
      const first = parts[0]
      if (!first || !eligible(first)) continue
      parts.forEach((part) => part.classList.add('ar-f'))
      footerGroups.set(first, parts)
      autoObserver.observe(first)
    }

    for (const section of all('section.pad')) {
      const rule = document.createElement('i')
      rule.className = 'drule'
      rule.setAttribute('aria-hidden', 'true')
      section.prepend(rule)
      if (section.getBoundingClientRect().top > fold) autoObserver.observe(rule)
      else rule.classList.add('static')
      scope.onCleanup(() => rule.remove())
    }
  })

  scope.onCleanup(() => {
    for (const [element, nodes] of originals) element.replaceChildren(...nodes)
    for (const element of all('.arm, .ar-h, .ar-f, .ar-c')) {
      element.classList.remove('arm', 'ar-h', 'ar-f', 'ar-c', 'on')
    }
    for (const stage of stages) stage.classList.remove('on')
    lifeLine.replaceChildren()
  })

  return resize
}
