'use client'

import { useRef } from 'react'

import styles from '../ukdebt.module.css'
import { useScrollProgress } from './atoms'
import type { CSSVars } from './atoms'
import type { SpendingItem } from './types'

const spending: SpendingItem[] = [
  { value: '£37 Billion', label: 'Housing benefits', size: 'small' },
  { value: '£62.2 Billion', label: 'Defence', size: 'medium' },
  { value: '£67 Billion', label: 'Schools', size: 'large' },
  { value: '£114 Billion', label: 'Debt interest', size: 'xlarge' },
]

function SpendingBubbles() {
  const ref = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(ref)

  return (
    <div
      ref={ref}
      className={styles.spendBubbles}
      style={
        {
          '--bubble-progress': progress,
          '--debt-glow-visible': Math.min(
            1,
            Math.max(0, (progress - 0.48) / 0.24),
          ),
        } as CSSVars
      }
    >
      {spending.map((item, index) => (
        <div
          key={item.label}
          className={`${styles.spendBubble} ${styles[item.size]}`}
          style={
            {
              '--bubble-index': index,
              '--bubble-visible': Math.min(
                1,
                Math.max(0, (progress - index * 0.16) / 0.24),
              ),
            } as CSSVars
          }
        >
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  )
}

export function SpendingPanel() {
  return (
    <section
      className={`${styles.glassPanel} ${styles.spendPanel} ${styles.revealPanel}`}
    >
      <div className={styles.panelBackdrop} aria-hidden="true" />
      <div className={`${styles.spendHeader} ${styles.revealUp}`}>
        <span />
        <h2>In 2026, they’ll spend:</h2>
        <span />
      </div>
      <SpendingBubbles />
    </section>
  )
}
