import styles from '../ukdebt.module.css'

export function InterestZero() {
  return (
    <section className={styles.zeroSection}>
      <div className={styles.zeroCopy}>
        <h2 className={styles.titleReveal}>
          Interest payments
          <br className={styles.zeroBrDesktop} /> produce
          <br className={styles.zeroBrMobile} /> absolutely
          <br className={styles.zeroBrDesktop} /> <mark>nothing.</mark>
        </h2>
        <p>
          They are the costs of consumption that has already happened. Costs
          over which the people burdened by them never had a say.
        </p>
      </div>
      <img
        className={styles.zeroFigure}
        src="/campaigns/ukdebt/zero-figure.png"
        alt=""
        aria-hidden="true"
      />
    </section>
  )
}
