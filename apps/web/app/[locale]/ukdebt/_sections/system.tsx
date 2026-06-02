import styles from '../ukdebt.module.css'
import { asset } from './atoms'

export function System() {
  return (
    <section className={styles.systemSection}>
      <div>
        <h2 className={`${styles.systemHeading} ${styles.titleReveal}`}>
          <span className={styles.systemLead}>
            But this is about
            <br />
            more than spending.
          </span>
          <span className={styles.systemMain}>
            It’s about the system
            <br />
            that made it possible.
          </span>
        </h2>
        <p className={`${styles.systemQuote} ${styles.copyReveal}`}>
          In 1984, the economist Friedrich Hayek said:{' '}
          <br className={styles.mobileOnlyBreak} aria-hidden="true" />
          <br className={styles.mobileOnlyBreak} aria-hidden="true" />
          "I don't believe we shall ever have good money again before we take
          the thing out of the hands of government. Because we can't take it
          violently out of the hands of government, all we can do is, by some
          sly or roundabout way,&nbsp; introduce something that they can't
          stop."
        </p>
        <div className={`${styles.systemBody} ${styles.copyReveal}`}>
          <p>
            He warned of a future where money
            <br />
            would be shaped by policy.
            <br />
            <br />
          </p>
          <p>
            And the consequences deferred.
            <br />
            <br />
            There’s no reforming the system we’re in.
          </p>
        </div>
        <img
          className={`${styles.hayekPortrait} ${styles.imageReveal}`}
          src={asset('hayek.webp')}
          alt="Friedrich Hayek"
        />
      </div>
    </section>
  )
}
