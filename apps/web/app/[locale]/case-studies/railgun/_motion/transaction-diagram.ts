import { clamp, easeOut, svgElement, type MotionScope } from './scope'

const walletX = 96
const walletY = 320
const broadcasterX = 606
const broadcasterYs = [176, 272, 368, 464]
const selected = 2
const offWhite = '#F5F5EF'
const lightBlue = '#C6EBF7'

export function mountTransactionDiagram(scope: MotionScope) {
  const svg = scope.select<SVGSVGElement>('#dsvg')
  const diagram = scope.select('#diagram')
  svg.replaceChildren()
  const paths = broadcasterYs.map((y) =>
    svgElement(svg, 'line', {
      x1: walletX,
      y1: walletY,
      x2: broadcasterX,
      y2: y,
      stroke: offWhite,
      'stroke-opacity': 0.18,
      'stroke-width': 1,
    })
  )
  const broadcasters = broadcasterYs.map((y) =>
    svgElement(svg, 'circle', {
      cx: broadcasterX,
      cy: y,
      r: 5,
      fill: offWhite,
      'fill-opacity': 0.4,
    })
  )
  const ring = svgElement(svg, 'circle', {
    cx: broadcasterX,
    cy: broadcasterYs[selected],
    r: 10,
    fill: 'none',
    stroke: lightBlue,
    'stroke-width': 1.5,
    opacity: 0,
  })
  const chosen = svgElement(svg, 'circle', {
    cx: broadcasterX,
    cy: broadcasterYs[selected],
    r: 4,
    fill: lightBlue,
    opacity: 0,
  })
  const walletRing = svgElement(svg, 'circle', {
    cx: walletX,
    cy: walletY,
    r: 14,
    fill: 'none',
    stroke: lightBlue,
    'stroke-width': 1.5,
    opacity: 0,
  })
  const wallet = svgElement(svg, 'circle', {
    cx: walletX,
    cy: walletY,
    r: 7,
    fill: offWhite,
  })
  const sealed = svgElement(svg, 'rect', {
    x: walletX - 4,
    y: walletY - 34,
    width: 8,
    height: 8,
    fill: lightBlue,
    opacity: 0,
  })

  function label(
    x: number,
    y: number,
    text: string,
    colour: string,
    opacity: number
  ) {
    const node = svgElement(svg, 'text', {
      x,
      y,
      'text-anchor': 'middle',
      fill: colour,
      'fill-opacity': opacity,
      'font-size': 10,
      'letter-spacing': '.4',
    })
    node.textContent = text
    return node
  }

  label(walletX, walletY + 30, diagram.dataset.wallet ?? '', offWhite, 0.85)
  label(
    broadcasterX,
    broadcasterYs[0] - 24,
    diagram.dataset.broadcasters ?? '',
    offWhite,
    0.85
  )
  const receiver = label(
    broadcasterX,
    broadcasterYs[selected] + 30,
    diagram.dataset.receiver ?? '',
    lightBlue,
    1
  )
  const packets = broadcasterYs.map(() =>
    svgElement(svg, 'circle', { r: 4, fill: lightBlue, opacity: 0 })
  )
  const arrows = broadcasterYs.map((y) => {
    const x = (walletX + broadcasterX) / 2
    const mid = (walletY + y) / 2
    const angle =
      (Math.atan2(y - walletY, broadcasterX - walletX) * 180) / Math.PI
    const group = svgElement(svg, 'g', {})
    svgElement(group, 'path', {
      d: 'M3 -3.5 L-0.5 0 L3 3.5',
      fill: 'none',
      stroke: lightBlue,
      'stroke-width': 1,
    })
    return { group, x, mid, angle }
  })

  let state = 0
  let start = 0
  let visible = false

  function setStep(step: number) {
    state = step
    start = performance.now()
    paths.forEach((path, index) => {
      const lit = step === 0 || step === 3 || (step === 4 && index === selected)
      path.setAttribute('stroke', lit ? lightBlue : offWhite)
      path.setAttribute('stroke-opacity', lit ? '1' : '.18')
      const { group, x, mid, angle } = arrows[index]
      group.setAttribute('opacity', lit ? '1' : '0')
      group.setAttribute(
        'transform',
        `translate(${x} ${mid}) rotate(${angle + (step === 3 ? 180 : 0)})`
      )
      broadcasters[index].setAttribute(
        'fill',
        step === 0 ? lightBlue : offWhite
      )
      broadcasters[index].setAttribute(
        'fill-opacity',
        step === 0 ? '1' : index === selected ? '0' : '.4'
      )
      packets[index].setAttribute('opacity', '0')
    })
    for (const node of [ring, chosen])
      node.setAttribute('opacity', step > 0 ? '1' : '0')
    ring.setAttribute('stroke-width', '1.5')
    walletRing.setAttribute('opacity', '0')
    wallet.setAttribute('r', '7')
    sealed.setAttribute('opacity', step === 2 ? '1' : '0')
    if (step === 2) {
      sealed.setAttribute('y', String(walletY - 12))
      sealed.setAttribute('transform', `rotate(45 ${walletX} ${walletY - 30})`)
    }
    receiver.setAttribute('opacity', step === 3 ? '1' : '0')
  }

  function movePacket(
    index: number,
    y: number,
    progress: number,
    outbound: boolean
  ) {
    const fromX = outbound ? walletX : broadcasterX
    const fromY = outbound ? walletY : y
    const toX = outbound ? broadcasterX : walletX
    const toY = outbound ? y : walletY
    packets[index].setAttribute('cx', String(fromX + (toX - fromX) * progress))
    packets[index].setAttribute('cy', String(fromY + (toY - fromY) * progress))
    packets[index].setAttribute('opacity', progress < 1 ? '1' : '0')
  }

  function animate(now: number) {
    if (!visible) return
    const elapsed = Math.max(0, now - start)
    if (state === 0) {
      broadcasterYs.forEach((y, i) =>
        movePacket(
          i,
          y,
          clamp(((elapsed + i * 300) % 1500) / 1500 / 0.7),
          false
        )
      )
    } else if (state === 1) {
      const t = clamp(elapsed / 320) - 1
      ring.setAttribute(
        'r',
        String(22 - 12 * (1 + 2.56 * t ** 3 + 1.56 * t ** 2))
      )
      if (elapsed > 400) {
        const phase = (elapsed % 2400) / 2400
        walletRing.setAttribute('r', String(10 + phase * 18))
        walletRing.setAttribute('opacity', (1 - phase).toFixed(2))
      }
    } else if (state === 2) {
      const t = easeOut(clamp(elapsed / 560))
      sealed.setAttribute('y', String(walletY - 12 - t * 22))
      sealed.setAttribute(
        'transform',
        `rotate(${45 * (1 - t)} ${walletX} ${walletY - 30})`
      )
    } else if (state === 3) {
      const phase = (elapsed % 2600) / 2600
      broadcasterYs.forEach((y, index) => {
        movePacket(index, y, clamp(phase / 0.5), true)
        if (index !== selected) {
          broadcasters[index].setAttribute(
            'fill-opacity',
            String(phase < 0.5 ? 0.4 : Math.max(0.1, 0.4 - (phase - 0.5) * 2))
          )
        }
      })
      ring.setAttribute(
        'stroke-width',
        phase >= 0.5 && phase < 0.62 ? '3' : '1.5'
      )
    } else {
      const phase = (elapsed % 2200) / 2200
      movePacket(0, broadcasterYs[selected], clamp(phase / 0.55), false)
      wallet.setAttribute('r', phase >= 0.55 && phase < 0.66 ? '9.5' : '7')
    }
    scope.frame(animate)
  }

  if (!scope.reduced) {
    scope
      .observe(([entry]) => {
        if (entry.isIntersecting && !visible) {
          visible = true
          start = performance.now()
          scope.frame(animate)
        } else if (!entry.isIntersecting) {
          visible = false
        }
      })
      .observe(diagram)
  }

  return setStep
}
