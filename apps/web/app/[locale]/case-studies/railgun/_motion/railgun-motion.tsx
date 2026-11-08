'use client'

import { useEffect, useRef, type ReactNode } from 'react'

import { mountNavigation } from './navigation'
import { mountReveals } from './reveals'
import { clamp, compactLayout, createMotionScope, easeOut } from './scope'
import { mountStackReplay } from './stack-replay'
import { mountTransaction } from './transaction'

const heroBootScript = `(() => {
  const root = document.currentScript.parentElement
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) root.classList.add('js')
  setTimeout(() => {
    if (!root.querySelector('#dsvg circle')) root.classList.remove('js')
  }, 1600)
})()`

export function RailgunMotion({
  children,
  className,
}: {
  children: ReactNode
  className: string
}) {
  const element = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const host = element.current
    if (!host) return

    const scope = createMotionScope(host)
    const { root, select, signal, reduced } = scope
    const hero = select('.hero')
    const photo = select<HTMLImageElement>('.hero .ph img')
    const loader = select('#hl')
    const quote = select('#qp')
    const sentence = select('#sentence')
    const left = select('#sentence .left')
    const right = select('#sentence .right')
    const rightLast = select('#sentence .r2')
    const revealLayout = mountReveals(scope)
    const stackLayout = mountStackReplay(scope)
    const navScroll = mountNavigation(scope)
    const transaction = mountTransaction(scope)
    const fontsReady = document.fonts.ready
    const skipController = new AbortController()
    let played = false
    let closerPlayed = false
    let ticking = false

    function playHero() {
      if (played || signal.aborted) return
      played = true
      scope.afterPaint(() => {
        root.classList.add('played')
        scope.timeout(() => loader.classList.add('gone'), 1500)
      })
    }

    function skipHero() {
      playHero()
      root.classList.add('skip')
      loader.classList.add('gone')
      skipController.abort()
    }

    function placeCloser() {
      sentence.style.setProperty('--ext', '0px')
      if (compactLayout()) {
        sentence.style.setProperty('--gapx', '0px')
        return
      }
      const extension = Math.max(
        0,
        rightLast.getBoundingClientRect().left -
          right.getBoundingClientRect().left
      )
      sentence.style.setProperty('--ext', `${extension.toFixed(1)}px`)
      const measure = document.createElement('span')
      measure.className = 'sentence-reference-width'
      measure.setAttribute('aria-hidden', 'true')
      sentence.append(measure)
      measure.textContent = left.innerText
      const leftWidth = measure.getBoundingClientRect().width
      measure.textContent = right.innerText
      const rightWidth = measure.getBoundingClientRect().width
      measure.remove()
      const travel = (sentence.clientWidth - leftWidth - rightWidth) / 2
      sentence.style.setProperty('--gapx', `${Math.max(32, travel)}px`)
      const size = parseFloat(getComputedStyle(sentence).fontSize)
      const height = left.getBoundingClientRect().height
      const half = height / 2
      sentence.style.setProperty(
        '--xh',
        `${((half + (half - size) / 2 + size * 0.49) / height) * 100}%`
      )
    }

    function playCloser() {
      closerPlayed = true
      if (reduced) return
      const start = performance.now() + 120
      function animate(now: number) {
        const t = clamp((now - start) / 1500)
        sentence.style.setProperty('--s', easeOut(t).toFixed(4))
        sentence.style.setProperty('--sr', t >= 1 ? '1' : '0')
        if (t < 1) scope.frame(animate)
      }
      scope.frame(animate)
    }

    function onScroll() {
      ticking = false
      navScroll()
      if (!reduced) {
        hero.style.setProperty(
          '--cover',
          clamp(scrollY / hero.offsetHeight).toFixed(3)
        )
        const rect = quote.getBoundingClientRect()
        quote.style.setProperty(
          '--q',
          clamp((innerHeight - rect.top) / (innerHeight + rect.height)).toFixed(
            3
          )
        )
      }
      transaction.onScroll()
      if (
        !closerPlayed &&
        sentence.getBoundingClientRect().top < innerHeight * 0.82
      )
        playCloser()
    }

    function layout() {
      revealLayout()
      transaction.layout()
      placeCloser()
      stackLayout()
      onScroll()
    }

    if (reduced) {
      root.classList.add('skip', 'played')
      loader.classList.add('gone')
    } else {
      root.classList.add('js')
      sentence.style.setProperty('--s', '0')
      sentence.style.setProperty('--sr', '0')
      const decoded = photo.decode?.().catch(() => {})
      void Promise.all([fontsReady, decoded]).then(playHero)
      scope.timeout(playHero, 1600)
      for (const event of ['wheel', 'touchstart', 'keydown', 'pointerdown']) {
        window.addEventListener(event, skipHero, {
          passive: true,
          signal: skipController.signal,
        })
      }
    }

    window.addEventListener(
      'scroll',
      () => {
        if (ticking) return
        ticking = true
        scope.frame(onScroll)
      },
      { passive: true, signal }
    )
    window.addEventListener('resize', layout, { signal })
    layout()
    void fontsReady.then(() => {
      if (!signal.aborted) layout()
    })

    return () => {
      skipController.abort()
      scope.dispose()
      root.classList.remove('js', 'played', 'skip')
    }
  }, [])

  return (
    <div
      className={`railgun ${className}`}
      ref={element}
      suppressHydrationWarning
    >
      <script dangerouslySetInnerHTML={{ __html: heroBootScript }} />
      {children}
    </div>
  )
}
