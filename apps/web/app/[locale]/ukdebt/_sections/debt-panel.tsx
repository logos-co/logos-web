'use client'

import { useRef } from 'react'

import styles from '../ukdebt.module.css'
import { useScrollProgress } from './atoms'
import type { CSSVars } from './atoms'

function DebtChart() {
  const ref = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(ref)

  return (
    <div
      ref={ref}
      className={styles.chart}
      style={{ '--chart-progress': progress } as CSSVars}
      aria-label="UK national debt rose from below one trillion pounds in 1990 to nearly three trillion pounds in 2026."
    >
      <p className={styles.chartTitle}>UK NATIONAL DEBT 1990-2026</p>
      <div className={styles.chartBody}>
        <div className={styles.yAxis}>
          <span>£2800BN</span>
          <span>£2000BN</span>
          <span>£1000BN</span>
        </div>
        <svg
          className={`${styles.chartSvg} no-fill`}
          viewBox="0 0 584 340"
          preserveAspectRatio="none"
          role="img"
          aria-hidden="true"
        >
          <line x1="0" y1="62" x2="584" y2="62" />
          <line x1="0" y1="164" x2="584" y2="164" />
          <line x1="0" y1="266" x2="584" y2="266" />
          <polyline
            points="0,328 96,309 196,309 278,300 315,266 454,164 584,102"
            pathLength="1"
          />
          <line className={styles.axisLine} x1="0" y1="340" x2="584" y2="340" />
        </svg>
      </div>
      <div className={styles.xAxis}>
        <span>1990</span>
        <span>2000</span>
        <span>2010</span>
        <span>2020</span>
        <span>2026</span>
      </div>
    </div>
  )
}

export function DebtPanel() {
  return (
    <section
      className={`${styles.glassPanel} ${styles.debtPanel} ${styles.revealPanel}`}
    >
      <div className={styles.panelBackdrop} aria-hidden="true" />
      <div className={`${styles.debtCopy} ${styles.revealUp}`}>
        <p>
          None of the £114 billion
          <br />
          goes to reducing the UK’s
          <br />
          £2.9 trillion total debt.
        </p>
        <p>
          It is simply the cost
          <br />
          of servicing that debt.
        </p>
      </div>
      <DebtChart />
    </section>
  )
}
