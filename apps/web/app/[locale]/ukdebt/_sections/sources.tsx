'use client'

import { useState } from 'react'

import styles from '../ukdebt.module.css'

const sources = [
  {
    label: 'Office of Budget Responsibility',
    href: 'https://obr.uk/',
  },
  {
    label: 'Office for National Statistics',
    href: 'https://www.ons.gov.uk/',
  },
  {
    label: 'Gov.uk',
    href: 'https://www.gov.uk/government/statistics/public-spending-statistics-release-november-2024',
  },
  {
    label: 'House of Commons Library',
    href: 'https://commonslibrary.parliament.uk/',
  },
]

export function Sources() {
  const [sourcesOpen, setSourcesOpen] = useState(false)

  return (
    <section
      className={`${styles.sourcesStrip} ${sourcesOpen ? styles.sourcesStripOpen : ''}`}
      aria-label="Sources"
    >
      <button
        className={styles.sourcesToggle}
        type="button"
        aria-expanded={sourcesOpen}
        aria-controls="ukdebt-sources"
        onClick={() => setSourcesOpen((open) => !open)}
      >
        Sources
      </button>
      <div className={styles.sourcesList} id="ukdebt-sources">
        {sources.map((source) => (
          <a
            key={source.label}
            href={source.href}
            target="_blank"
            rel="noopener noreferrer"
          >
            {source.label}
          </a>
        ))}
      </div>
    </section>
  )
}
