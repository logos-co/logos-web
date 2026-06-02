import styles from '../ukdebt.module.css'
import { asset } from './atoms'

export function History() {
  return (
    <section className={`${styles.historyPanel} ${styles.revealPanel}`}>
      <div>
        <h2 className={styles.titleReveal}>
          After the 2008 financial crisis, artificially low interest rates set
          by the Bank of England made borrowing cheap.
        </h2>
        <div className={`${styles.historyIntro} ${styles.revealUp}`}>
          <p>
            So, the government borrowed.{' '}
            <span className={styles.aLotMobileBold}>A lot.</span>
          </p>
          <p>
            But the cost wasn’t paid by those who made the decisions. It’s
            being paid by the rest of us.
          </p>
          <p>
            <strong>Today and tomorrow.</strong>
          </p>
        </div>
        <div className={`${styles.historyColumns} ${styles.revealUp}`}>
          <p>
            Someone born in the 1990s entered the workforce
            <br className={styles.figmaBreak} aria-hidden="true" /> in roughly
            2008–2012, just as this debt explosion
            <br className={styles.figmaBreak} aria-hidden="true" /> was
            beginning. Someone born in 2008 is now 18
            <br className={styles.figmaBreak} aria-hidden="true" /> and
            inheriting the wave of skyrocketing
            <br className={styles.figmaBreak} aria-hidden="true" /> debt
            issued in 2020.
          </p>
          <p>
            The entire working life of these generations will be
            <br className={styles.figmaBreak} aria-hidden="true" /> spent in a
            fiscal environment shaped by crippling debt:
            <br className={styles.figmaBreak} aria-hidden="true" /> haunted by
            spending that happened before they were
            <br className={styles.figmaBreak} aria-hidden="true" /> even
            conscious, and paying the price of choices they
            <br className={styles.figmaBreak} aria-hidden="true" /> never
            made.
          </p>
        </div>
      </div>
      <img
        className={styles.historyPortrait}
        src={asset('portrait.webp')}
        alt=""
      />
    </section>
  )
}
