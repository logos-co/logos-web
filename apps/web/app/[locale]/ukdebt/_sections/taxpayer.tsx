'use client'

import { useRef } from 'react'

import styles from '../ukdebt.module.css'
import { asset, useActiveRowIndex, useScrollProgress } from './atoms'
import type { CSSVars } from './atoms'
import type { Orb } from './types'

const orbs: Orb[] = [
  {
    src: 'orb-1.webp',
    className: styles.orbOne,
    alt: '',
    floatX: -120,
    floatY: -150,
  },
  {
    src: 'orb-2.webp',
    className: styles.orbTwo,
    alt: '',
    floatX: 90,
    floatY: -140,
  },
  {
    src: 'orb-3.webp',
    className: styles.orbThree,
    alt: '',
    floatX: -120,
    floatY: 130,
  },
  {
    src: 'orb-4.webp',
    className: styles.orbFour,
    alt: '',
    floatX: 0,
    floatY: -120,
  },
  {
    src: 'orb-5.webp',
    className: styles.orbFive,
    alt: '',
    floatX: 120,
    floatY: -90,
  },
  {
    src: 'orb-6.webp',
    className: styles.orbSix,
    alt: '',
    floatX: 90,
    floatY: 120,
  },
  {
    src: 'orb-7.webp',
    className: styles.orbSeven,
    alt: '',
    floatX: -130,
    floatY: 60,
  },
  {
    src: 'orb-8.webp',
    className: styles.orbEight,
    alt: '',
    floatX: 140,
    floatY: 40,
  },
  {
    src: 'orb-9.webp',
    className: styles.orbNine,
    alt: '',
    floatX: 0,
    floatY: 130,
  },
]

const taxpayerItems = [
  'Doctors',
  'Schools',
  'Housing',
  'Social care',
  'Hospitals',
  'Roads',
  'Police',
]

export function TaxpayerSection() {
  const ref = useRef<HTMLElement>(null)
  const tableRef = useRef<HTMLDivElement>(null)
  const progress = useScrollProgress(ref)
  const activeIndex = useActiveRowIndex(tableRef, taxpayerItems.length)

  return (
    <section
      ref={ref}
      className={styles.taxpayerSection}
      style={{ '--taxpayer-progress': progress } as CSSVars}
    >
      {orbs.map((orb, index) => {
        const orbVisible = Math.min(
          1,
          Math.max(0, (progress - index * 0.03) / 0.18),
        )

        return (
          <img
            key={orb.src}
            className={`${styles.orb} ${orb.className}`}
            src={asset(orb.src)}
            alt={orb.alt}
            style={
              {
                '--orb-visible': orbVisible,
                '--orb-tx': `${orb.floatX * (1 - progress)}px`,
                '--orb-ty': `${orb.floatY * (1 - progress)}px`,
                '--orb-scale': 0.92 + progress * 0.08,
              } as CSSVars
            }
          />
        )
      })}
      <h2 className={styles.titleReveal}>
        That’s £3,400 per taxpayer every year that could be spent making the
        lives of every single citizen better.
      </h2>
      <div ref={tableRef} className={styles.taxpayerTable}>
        {taxpayerItems.map((item, i) => (
          <p
            key={item}
            className={i === activeIndex ? styles.taxpayerRowActive : undefined}
          >
            {item}
          </p>
        ))}
      </div>
    </section>
  )
}
