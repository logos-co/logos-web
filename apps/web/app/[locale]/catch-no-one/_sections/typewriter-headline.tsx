/**
 * Hero headline that types itself in once, then stays put.
 *
 * Behaviour, per the design request ("a quick typewriter effect without cursor —
 * that remains static after the first time it's loaded"):
 *   - no caret; the yellow highlight simply grows with the second line
 *   - runs at most once per browser session, so returning to the page from
 *     elsewhere on the site does not replay it
 *   - skipped entirely when the visitor prefers reduced motion
 *
 * Avoiding the flash-then-retype trap
 * -----------------------------------
 * The server sends the complete headline, so crawlers and JS-less visitors get
 * the real text. The browser paints that HTML long before React hydrates, so
 * blanking the headline from an effect would show the full line, wipe it, and
 * retype — the opposite of what was asked for.
 *
 * Instead `TypewriterArmingScript` runs synchronously *before* the headline is
 * parsed (see `hero.tsx`) and marks the document when the animation should
 * play. Two copies of the headline then sit in the DOM and CSS alone picks the
 * one to show, so the choice is settled at first paint and React never has to
 * swap anything:
 *   - unarmed (no JS, reduced motion, already typed) → the static copy shows
 *   - armed → the static copy is hidden and the animated copy, which renders
 *     empty on both server and client, types itself in
 */
'use client'

import { useEffect, useLayoutEffect, useState } from 'react'

const CHAR_INTERVAL_MS = 26

export const TYPEWRITER_SESSION_KEY = 'catch-no-one:headline-typed'
/** Set on <html> before first paint when the animation should play. */
export const TYPEWRITER_ARMED_CLASS = 'catch-no-one-typewriter-armed'

// Tailwind only sees class names it can read literally in the source, so these
// two selectors spell `TYPEWRITER_ARMED_CLASS` out rather than interpolating it.
// Keep all three in sync.
/** Shown only while armed. */
const ARMED_ONLY = 'hidden [.catch-no-one-typewriter-armed_&]:block'
/** Hidden only while armed. */
const UNARMED_ONLY = '[.catch-no-one-typewriter-armed_&]:hidden'

/**
 * Synchronous arming script. Must be rendered *before* the headline so it
 * executes while the parser is still above it — the same pre-paint trick the
 * site already uses for its theme toggle.
 */
export function TypewriterArmingScript() {
  const source = `(function(){try{
if(window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
if(window.sessionStorage&&window.sessionStorage.getItem('${TYPEWRITER_SESSION_KEY}')==='1')return;
document.documentElement.classList.add('${TYPEWRITER_ARMED_CLASS}');
}catch(e){}})()`

  return <script dangerouslySetInnerHTML={{ __html: source }} />
}

const useIsomorphicLayoutEffect =
  typeof window === 'undefined' ? useEffect : useLayoutEffect

const isArmed = (): boolean =>
  document.documentElement.classList.contains(TYPEWRITER_ARMED_CLASS)

const rememberTypedThisSession = (): void => {
  try {
    window.sessionStorage.setItem(TYPEWRITER_SESSION_KEY, '1')
  } catch {
    // Storage can be blocked (private mode, embedded webviews). Non-fatal:
    // the effect simply replays on the next visit.
  }
}

type Props = {
  line1: string
  line2: string
  className?: string
}

export function TypewriterHeadline({ line1, line2, className = '' }: Props) {
  const total = line1.length + line2.length
  // Starts empty on both server and client so hydration matches; the arming
  // script has already decided whether this copy is the visible one.
  const [revealed, setRevealed] = useState(0)
  const [isTyping, setIsTyping] = useState(false)

  useIsomorphicLayoutEffect(() => {
    if (isArmed()) {
      setIsTyping(true)
      return
    }
    // Not animating: fill the hidden copy in so it never lags behind the
    // static one if the class is toggled later (e.g. by a live preview).
    setRevealed(total)
  }, [total])

  useEffect(() => {
    if (!isTyping) return

    if (revealed >= total) {
      setIsTyping(false)
      rememberTypedThisSession()
      return
    }

    const timer = window.setTimeout(
      () => setRevealed((count) => count + 1),
      CHAR_INTERVAL_MS
    )
    return () => window.clearTimeout(timer)
  }, [isTyping, revealed, total])

  return (
    <h1 className={`text-h2 ${className}`} aria-label={`${line1} ${line2}`}>
      <span aria-hidden="true" className={UNARMED_ONLY}>
        <HeadlineLines line1={line1} line2={line2} />
      </span>
      <span aria-hidden="true" className={ARMED_ONLY}>
        <HeadlineLines
          line1={line1.slice(0, Math.min(revealed, line1.length))}
          line2={line2.slice(0, Math.max(0, revealed - line1.length))}
        />
      </span>
    </h1>
  )
}

/**
 * Two headline lines, the second sitting on a yellow highlight that is sized
 * to the text so it grows as the line types in.
 */
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
