import Link from 'next/link'

import styles from '../ukdebt.module.css'
import { asset } from './atoms'

export function Hero() {
  return (
    <section className={styles.hero}>
      <Link className={styles.logoLink} href="/" aria-label="Logos home">
        <img src="/assets/logos-black.svg" alt="" />
      </Link>
      <div className={styles.heroFigure} aria-hidden="true">
        <img src={asset('hero-figure.webp')} alt="" />
      </div>
      <div className={styles.heroCopy}>
        <h1>
          In 2026, the UK government
          <br />
          is set to spend <strong>£114 billion</strong> on
          <br />
          debt interest payments alone.
        </h1>
        <div
          className={`${styles.rateList} ${styles.revealClip}`}
          aria-label="Debt interest payment rates"
        >
          <p>
            <strong>£312+</strong> million a day.
          </p>
          <p>
            <strong>£13+</strong> million an hour.
          </p>
          <p>
            <strong>£216,000+</strong> a minute.
          </p>
          <p>
            <strong>£3,600+</strong> a second.
          </p>
        </div>
      </div>
    </section>
  )
}
