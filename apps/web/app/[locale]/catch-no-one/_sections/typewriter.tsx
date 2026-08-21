/**
 * Typewriter primitives for the campaign page.
 *
 * Each quoted exhibit types itself in when its card scrolls into view. The hero
 * headline can do the same on load, but is currently set to render statically
 * — see `HeroHeadline`'s `animate` prop. A run happens once: nothing loops,
 * nothing replays once finished, and it is skipped entirely for visitors who
 * prefer reduced motion.
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
/**
 * Hidden once the animation is armed, but still taking up its space.
 *
 * Used for the tail of a quote that has not been typed yet, and for the copy of
 * the hero headline that reserves its height.
 */
const UNTYPED = '[.catch-no-one-typewriter-armed_&]:invisible'
/**
 * Laid over the reserved space; only rendered once the animation is armed.
 *
 * It carries the cap-height trim itself: `text-box-trim` is not inherited and
 * does not reach out-of-flow descendants, so without this the typed copy keeps
 * the half-leading its in-flow twin had trimmed and lands a few pixels low.
 */
const OVERLAID =
  'absolute inset-0 hidden [text-box:trim-both_cap_alphabetic] [.catch-no-one-typewriter-armed_&]:block'

/**
 * Read back out of the variant above rather than declared a second time: that
 * is the only way to keep the class the arming script sets and the class the
 * CSS keys off from drifting apart. If the pattern ever stops matching the
 * name comes back empty, the script's `classList.add` throws into its own
 * try/catch, and the page simply renders the static text.
 */
export const TYPEWRITER_ARMED_CLASS =
  UNTYPED.match(/^\[\.([\w-]+)_&\]/)?.[1] ?? ''

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
  // Guarded: `classList.contains('')` throws, so an empty name has to mean
  // "not armed" rather than take the page down with it.
  TYPEWRITER_ARMED_CLASS !== '' &&
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
 * (only used when `startOnView`) and how many characters to show. With
 * `enabled: false` nothing is ever hidden and no timers run.
 */
function useTypewriter(
  total: number,
  { startOnView, enabled }: { startOnView: boolean; enabled: boolean }
) {
  const anchor = useRef<HTMLHeadingElement | null>(null)
  // Starts empty on both server and client so hydration matches; the arming
  // script has already decided whether the typed copy is the visible one.
  const [revealed, setRevealed] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useIsomorphicLayoutEffect(() => {
    // The bundle is running, so the arming script's failsafe is not needed.
    window.__catchNoOneTypewriterHydrated?.()

    if (!enabled || !isArmed()) {
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
  }, [enabled, startOnView, total])

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

/**
 * Hero headline: two lines, the second sitting on a yellow highlight.
 *
 * `animate` types the headline in on load. It is off today — the effect is
 * reserved for the quote cards — but the machinery is kept behind the prop so
 * turning it back on is a one-word change at the call site.
 */
export function HeroHeadline({
  line1,
  line2,
  animate,
  className = '',
}: {
  line1: string
  line2: string
  /** Type the headline in on page load instead of rendering it outright. */
  animate: boolean
  className?: string
}) {
  const { revealed } = useTypewriter(line1.length + line2.length, {
    startOnView: false,
    enabled: animate,
  })

  if (!animate) {
    return (
      <h1 className={className}>
        <HeadlineLines line1={line1} line2={line2} />
      </h1>
    )
  }

  return (
    <h1 className={`relative ${className}`} aria-label={`${line1} ${line2}`}>
      <span
        aria-hidden="true"
        data-typewriter="reserved"
        className={`block ${UNTYPED}`}
      >
        <HeadlineLines line1={line1} line2={line2} />
      </span>
      <span aria-hidden="true" data-typewriter="typed" className={OVERLAID}>
        <HeadlineLines
          holdEmptyLines
          line1={line1.slice(0, Math.min(revealed, line1.length))}
          line2={line2.slice(0, Math.max(0, revealed - line1.length))}
        />
      </span>
    </h1>
  )
}

/**
 * Figma draws the highlight as a fixed rect: 1em tall, starting 3px above the
 * cap top of a 56px line (0.054em) — so it clears the caps and hangs below the
 * baseline. Offsetting from the line box instead would track the font's
 * half-leading and sit too high with no margin under the text.
 */
const HIGHLIGHT_OFFSET = 'top-[0.118em]'

function HeadlineLines({
  line1,
  line2,
  /**
   * Only the animated copy needs this. It is absolutely positioned, so holding
   * empty lines open costs nothing, while doing the same in the flow would
   * inflate the headline past the height Figma gives it.
   */
  holdEmptyLines = false,
}: {
  line1: string
  line2: string
  holdEmptyLines?: boolean
}) {
  const hold = holdEmptyLines ? 'min-h-[1em]' : ''

  return (
    <>
      <span className={`block ${hold}`}>{line1}</span>
      <span className={`relative block w-fit ${hold}`}>
        {line2 ? (
          <span
            aria-hidden="true"
            className={`absolute -right-2 -left-2 h-[1em] ${HIGHLIGHT_OFFSET} bg-brand-yellow`}
          />
        ) : null}
        <span className="relative">{line2}</span>
      </span>
    </>
  )
}

/**
 * Quoted exhibit that types itself in when its card scrolls into view.
 *
 * The whole quote is always in the flow — the untyped tail is merely invisible,
 * which still occupies its space. That keeps the line breaks the finished ones
 * from the very first frame, so a word can never start at the end of one line
 * and jump to the next as it grows. It also means the card is its final height
 * throughout, with no separate copy needed to reserve it.
 *
 * `role="paragraph"` cannot carry an accessible name, so the quote reaches
 * assistive tech through a screen-reader-only copy; the visual one is hidden
 * from it, since a half-typed string should never be announced.
 */
export function TypewriterQuote({
  children,
  className = '',
}: {
  children: string
  className?: string
}) {
  const { anchor, revealed } = useTypewriter(children.length, {
    startOnView: true,
    enabled: true,
  })

  return (
    <p ref={anchor as RefObject<HTMLParagraphElement>} className={className}>
      {/*
        `select-none` keeps this out of a copied selection. Without it, copying
        a quote — the whole point of a page built on citations — yields the text
        twice, once from here and once from the visible copy.
      */}
      <span className="sr-only select-none">{children}</span>
      <span aria-hidden="true">
        {children.slice(0, revealed)}
        <span data-typewriter="untyped" className={UNTYPED}>
          {children.slice(revealed)}
        </span>
      </span>
    </p>
  )
}
