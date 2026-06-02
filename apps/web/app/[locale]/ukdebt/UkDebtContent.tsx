'use client'

import { useEffect, useState } from 'react'

import styles from './ukdebt.module.css'
import { useTitleReveal } from './_sections/atoms'
import { Cta } from './_sections/cta'
import { DebtPanel } from './_sections/debt-panel'
import { Hero } from './_sections/hero'
import { History } from './_sections/history'
import { InterestZero } from './_sections/interest-zero'
import { Sources } from './_sections/sources'
import { SpendingPanel } from './_sections/spending-panel'
import { System } from './_sections/system'
import { TaxpayerSection } from './_sections/taxpayer'

export default function UkDebtContent() {
  const [isAnimated, setIsAnimated] = useState(false)

  useTitleReveal()

  // Arm the scroll-reveal animations only after the client has mounted, and
  // never when the user prefers reduced motion. Until then (and if the bundle
  // is blocked or fails to hydrate) the content stays visible by default
  // instead of being hidden behind a JS-driven reveal it may never receive.
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    ).matches

    if (!prefersReducedMotion) {
      setIsAnimated(true)
    }
  }, [])

  return (
    <div className={`${styles.page}${isAnimated ? ` ${styles.jsReady}` : ''}`}>
      <Hero />
      <DebtPanel />
      <SpendingPanel />
      <InterestZero />
      <TaxpayerSection />
      <History />
      <System />
      <Cta />
      <Sources />
    </div>
  )
}
