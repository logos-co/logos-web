import { compactLayout } from './scope'

const entrances = [
  { until: 4, delay: 0 },
  { until: 8, delay: 70 },
  { until: Infinity, delay: 190 },
]

export function renderHeroLines(heading: HTMLElement, lines: string[]) {
  const words = lines.flatMap((line) => line.split(' '))
  const measure = document.createElement('span')
  measure.className = 'hero-reference-line'
  measure.setAttribute('aria-hidden', 'true')
  const base = heading.closest<HTMLElement>('.base')!
  const styles = getComputedStyle(base)
  const width =
    base.clientWidth -
    parseFloat(styles.paddingLeft) -
    parseFloat(styles.paddingRight)
  measure.style.width = `${compactLayout() ? width : width - 324}px`
  heading.append(measure)

  const overhang = parseFloat(getComputedStyle(measure).fontSize) * 0.75
  const groups = entrances.map(({ until, delay }, i) => {
    measure.textContent = words
      .slice(entrances[i - 1]?.until ?? 0, until)
      .join(' ')
    return {
      until,
      delay,
      travel: measure.getBoundingClientRect().height + overhang,
    }
  })
  measure.remove()

  // A line in the approved mobile frame can contain words from two prototype groups.
  // Keep its text on one baseline while each fragment follows its original group.
  let wordIndex = 0
  const fragment = document.createDocumentFragment()
  lines.forEach((line, i) => {
    if (i) fragment.append(' ')
    const mask = document.createElement('span')
    mask.className = 'ln'
    let run: HTMLSpanElement | undefined
    let current = -1
    for (const word of line.split(' ')) {
      const index = groups.findIndex((group) => wordIndex < group.until)
      const group = groups[index]
      if (run && current === index) {
        run.append(` ${word}`)
      } else {
        if (run) mask.append(' ')
        run = document.createElement('span')
        run.textContent = word
        run.style.setProperty('--d', `${group.delay}ms`)
        run.style.setProperty('--travel', `${group.travel}px`)
        mask.append(run)
        current = index
      }
      wordIndex++
    }
    fragment.append(mask)
  })
  heading.replaceChildren(fragment)
}
