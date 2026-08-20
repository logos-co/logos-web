/**
 * Typewriter primitives for the campaign page.
 *
 * The hero headline types itself in on every page load; each quoted exhibit
 * types itself in when its card scrolls into view. Both run once — nothing
 * loops and nothing replays once finished — and both are skipped entirely for
 * visitors who prefer reduced motion.
 *
 * Avoiding the flash-then-retype trap
 * -----------------------------------
 * The server sends the complete text, so crawlers and JS-less visitors get the
 * real copy. The browser paints that HTML long before React hydrates, so
 * blanking a quote from an effect would show it, wipe it, and retype.
 *
 * Instead `TypewriterArmingScript` runs synchronously *before* any of this text
 * is parsed (see `hero.tsx`) and marks the document when the animation should
 * play. Two copies of every animated string sit in the DOM and CSS alone picks
 * which one shows, so the choice is settled at first paint and React never has
 * to swap anything:
 *   - unarmed (no JS, reduced motion) → the static copy shows
 *   - armed → the static copy stays in the flow but invisible, so it still
 *     reserves its final height, and the typed copy is laid over it
 *
 * Reserving the height that way means a quote that ends up three lines tall
 * does not shove the rest of the page down as it types.
 */
'use client'

import type { RefObject } from 'react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'

const CHAR_INTERVAL_MS = 26
/**
 * A quote card starts typing once its top rises above this fraction of the
 * viewport. Expressed as a margin rather than a visible-area ratio so it
 * behaves the same whether the card is one line tall or five.
 */
const VIEW_TRIGGER_MARGIN = 0.15
/**
 * How long the arming script waits for the bundle before giving up and showing
 * the static text. Without this, a bundle that never executes would leave every
 * animated heading blank, since arming happens in its own inline script.
 */
const HYDRATION_FAILSAFE_MS = 4000

declare global {
  interface Window {
    /** Set by the arming script; called once a typewriter mounts. */
    __catchNoOneTypewriterHydrated?: () => void
  }
}

// Tailwind only sees class names it can read literally in the source, so the
// armed class has to be spelled out inside these variants rather than
// interpolated in.
/** Stays in the flow to reserve height, but hidden once the animation is armed. */
const RESERVES_HEIGHT = '[.catch-no-one-typewriter-armed_&]:invisible'
/** Laid over the reserved space; only rendered once the animation is armed. */
const OVERLAID =
  'absolute inset-0 hidden [.catch-no-one-typewriter-armed_&]:block'

/**
 * Read back out of the variant above rather than declared a second time: that
 * is the only way to keep the class the arming script sets and the class the
 * CSS keys off from drifting apart. If the pattern ever stops matching the
 * name comes back empty, the script's `classList.add` throws into its own
 * try/catch, and the page simply renders the static text.
 */
export const TYPEWRITER_ARMED_CLASS =
  RESERVES_HEIGHT.match(/^\[\.([\w-]+)_&\]/)?.[1] ?? ''

/**
 * Synchronous arming script. Must be rendered *before* the first animated
 * string so it executes while the parser is still above it — the same pre-paint
 * trick the site already uses for its theme toggle.
 */
export function TypewriterArmingScript() {
  const source = `(function(){try{
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var d=document.documentElement;
d.classList.add('${TYPEWRITER_ARMED_CLASS}');
var t=setTimeout(function(){d.classList.remove('${TYPEWRITER_ARMED_CLASS}')},${HYDRATION_FAILSAFE_MS});
window.__catchNoOneTypewriterHydrated=function(){clearTimeout(t)};
}catch(e){}})()`

  return <script dangerouslySetInnerHTML={{ __html: source }} />
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

const isArmed = (): boolean =>
  document.documentElement.classList.contains(TYPEWRITER_ARMED_CLASS)

/** Has `node` risen far enough up the viewport to start typing? */
const hasEnteredView = (node: Element): boolean => {
  const { top, bottom } = node.getBoundingClientRect()
  return bottom > 0 && top < window.innerHeight * (1 - VIEW_TRIGGER_MARGIN)
}

/**
 * Reveals `total` characters one at a time.
 *
 * Returns the ref to attach to the element whose visibility starts the run
 * (only used when `startOnView`) and how many characters to show.
 */
function useTypewriter(total: number, startOnView: boolean) {
  const anchor = useRef<HTMLHeadingElement | null>(null)
  // Starts empty on both server and client so hydration matches; the arming
  // script has already decided whether the typed copy is the visible one.
  const [revealed, setRevealed] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useIsomorphicLayoutEffect(() => {
    // The bundle is running, so the arming script's failsafe is not needed.
    window.__catchNoOneTypewriterHydrated?.()

    if (!isArmed()) {
      // Not animating: fill the overlaid copy in so it never lags behind the
      // static one if the class is toggled later (e.g. by a live preview).
      setRevealed(total)
      return
    }

    const node = anchor.current
    if (!startOnView || !node) {
      setIsTyping(true)
      return
    }

    // A card that is already on screen starts straight away, so the run does
    // not wait on the observer's first callback. Anything further down the page
    // waits to be scrolled to.
    if (hasEnteredView(node) || typeof IntersectionObserver === 'undefined') {
      setIsTyping(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return
        setIsTyping(true)
        observer.disconnect()
      },
      { rootMargin: `0px 0px -${VIEW_TRIGGER_MARGIN * 100}% 0px` }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [startOnView, total])

  useEffect(() => {
    if (!isTyping) return
    if (revealed >= total) {
      setIsTyping(false)
      return
    }

    const timer = window.setTimeout(
      () => setRevealed((count) => count + 1),
      CHAR_INTERVAL_MS
    )
    return () => window.clearTimeout(timer)
  }, [isTyping, revealed, total])

  return { anchor, revealed }
}

/** Hero headline: two lines, the second sitting on a yellow highlight. */
export function TypewriterHeadline({
  line1,
  line2,
  className = '',
}: {
  line1: string
  line2: string
  className?: string
}) {
  const { revealed } = useTypewriter(line1.length + line2.length, false)

  return (
    <h1 className={`relative ${className}`} aria-label={`${line1} ${line2}`}>
      <span
        aria-hidden="true"
        data-typewriter="reserved"
        className={`block ${RESERVES_HEIGHT}`}
      >
        <HeadlineLines line1={line1} line2={line2} />
      </span>
      <span aria-hidden="true" data-typewriter="typed" className={OVERLAID}>
        <HeadlineLines
          line1={line1.slice(0, Math.min(revealed, line1.length))}
          line2={line2.slice(0, Math.max(0, revealed - line1.length))}
        />
      </span>
    </h1>
  )
}

function HeadlineLines({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <>
      <span className="block min-h-[1em]">{line1}</span>
      <span className="relative block min-h-[1em] w-fit">
        {line2 ? (
          <span className="absolute inset-y-0 -right-2 -left-2 bg-brand-yellow" />
        ) : null}
        <span className="relative">{line2}</span>
      </span>
    </>
  )
}

/**
 * Quoted exhibit that types itself in when its card scrolls into view.
 *
 * `role="paragraph"` cannot carry an accessible name, so the full quote is
 * exposed through a screen-reader-only copy rather than an `aria-label`. Both
 * visual copies are hidden from assistive tech, which would otherwise read the
 * half-typed one.
 */
export function TypewriterQuote({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  const { anchor, revealed } = useTypewriter(children.length, true)

  return (
    <p
      ref={anchor as RefObject<HTMLParagraphElement>}
      className={`relative ${className}`}
    >
      <span className="sr-only">{children}</span>
      <span
        aria-hidden="true"
        data-typewriter="reserved"
        className={`block ${RESERVES_HEIGHT}`}
      >
        {children}
      </span>
      <span aria-hidden="true" data-typewriter="typed" className={OVERLAID}>
        {children.slice(0, revealed)}
      </span>
    </p>
  )
}
