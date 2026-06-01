'use client'

import { useEffect, useRef, useState } from 'react'
import type { CSSProperties, FormEvent, RefObject } from 'react'
import Link from 'next/link'

import styles from './ukdebt.module.css'

// CSS custom properties are not part of React's CSSProperties type, so style
// objects that set `--*` variables are cast to this widened type.
type CSSVars = CSSProperties & Record<`--${string}`, string | number>

const asset = (name: string) => `/campaigns/ukdebt/${name}`
const UK_DEBT_NEWSLETTER_ID = '6a0dd2f8d5b09400014fed2e'
// Target deploys as a static export (no API routes), so the signup posts
// directly to the live logos.co proxy instead of a relative /api path.
const SIGNUP_ENDPOINT = 'https://logos.co/api/email-signup'

type SpendingItem = {
  value: string
  label: string
  size: 'small' | 'medium' | 'large' | 'xlarge'
}

const spending: SpendingItem[] = [
  { value: '£37 Billion', label: 'Housing benefits', size: 'small' },
  { value: '£62.2 Billion', label: 'Defence', size: 'medium' },
  { value: '£67 Billion', label: 'Schools', size: 'large' },
  { value: '£114 Billion', label: 'Debt interest', size: 'xlarge' },
]

type Orb = {
  src: string
  className: string
  alt: string
  floatX: number
  floatY: number
}

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

function useScrollProgress<T extends HTMLElement>(ref: RefObject<T | null>) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    let frame = 0

    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()
      const viewport = window.innerHeight || 1
      const start = viewport * 0.85
      const end = viewport * 0.2
      const raw = (start - rect.top) / (start - end)
      setProgress(Math.min(1, Math.max(0, raw)))
    }

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [ref])

  return progress
}

function useActiveRowIndex<T extends HTMLElement>(
  ref: RefObject<T | null>,
  totalRows: number,
) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const element = ref.current

    if (!element) {
      return undefined
    }

    let frame = 0

    const update = () => {
      frame = 0
      const rect = element.getBoundingClientRect()

      if (rect.height <= 0) {
        return
      }

      const viewportCenter = (window.innerHeight || 1) / 2
      const rowHeight = rect.height / totalRows
      const offset = viewportCenter - rect.top
      const raw = Math.floor(offset / rowHeight)
      const clamped = Math.min(totalRows - 1, Math.max(0, raw))
      setIndex(clamped)
    }

    const requestUpdate = () => {
      if (frame === 0) {
        frame = window.requestAnimationFrame(update)
      }
    }

    update()
    window.addEventListener('scroll', requestUpdate, { passive: true })
    window.addEventListener('resize', requestUpdate)

    return () => {
      window.removeEventListener('scroll', requestUpdate)
      window.removeEventListener('resize', requestUpdate)
      if (frame) {
        window.cancelAnimationFrame(frame)
      }
    }
  }, [ref, totalRows])

  return index
}

function useTitleReveal() {
  useEffect(() => {
    const elements = Array.from(
      document.querySelectorAll(
        `.${styles.titleReveal}, .${styles.copyReveal}, .${styles.imageReveal}`,
      ),
    )
    const systemSection = document.querySelector(`.${styles.systemSection}`)

    if (elements.length === 0 && !systemSection) {
      return undefined
    }

    if (!('IntersectionObserver' in window)) {
      elements.forEach((element) =>
        element.classList.add(styles.titleRevealed),
      )
      systemSection
        ?.querySelectorAll(
          `.${styles.titleReveal}, .${styles.copyReveal}, .${styles.imageReveal}`,
        )
        .forEach((element) => element.classList.add(styles.titleRevealed))
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (entry.target === systemSection) {
              entry.target
                .querySelectorAll(
                  `.${styles.titleReveal}, .${styles.copyReveal}, .${styles.imageReveal}`,
                )
                .forEach((element) =>
                  element.classList.add(styles.titleRevealed),
                )
            } else {
              entry.target.classList.add(styles.titleRevealed)
            }
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '0px 0px 15% 0px', threshold: 0.01 },
    )

    elements.forEach((element) => observer.observe(element))
    if (systemSection) {
      observer.observe(systemSection)
    }

    return () => observer.disconnect()
  }, [])
}

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

function TaxpayerSection() {
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

export default function UkDebtContent() {
  const [sourcesOpen, setSourcesOpen] = useState(false)
  const [isSignupOpen, setIsSignupOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [signupStatus, setSignupStatus] = useState<
    'idle' | 'loading' | 'success' | 'error'
  >('idle')
  const [signupMessage, setSignupMessage] = useState('')
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

  const handleSignupSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (!email || !email.includes('@')) {
      setSignupStatus('error')
      setSignupMessage('Please enter a valid email address.')
      return
    }

    setSignupStatus('loading')
    setSignupMessage('')

    try {
      const response = await fetch(SIGNUP_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          newsletter: UK_DEBT_NEWSLETTER_ID,
        }),
      })
      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to subscribe.')
      }

      setEmail('')
      setSignupStatus('success')
      setSignupMessage('You’re on the list.')
    } catch (error) {
      setSignupStatus('error')
      setSignupMessage(
        error instanceof Error ? error.message : 'Failed to subscribe.',
      )
    }
  }

  return (
    <div className={`${styles.page}${isAnimated ? ` ${styles.jsReady}` : ''}`}>
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

      <TaxpayerSection />

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

      <section className={styles.ctaSection}>
        <div className={styles.ctaBackdrop} aria-hidden="true" />
        <h2 className={styles.titleReveal}>
          Exit the system.
          <br />
          Build the alternative.
        </h2>
        <div className={styles.ctaActions}>
          <div className={styles.ctaPrimaryRow}>
            <Link
              className={`${styles.ctaButton} ${styles.ctaButtonPrimary}`}
              href="/active-circles"
            >
              Join a Circle
            </Link>
          </div>
          <div className={styles.ctaSecondaryRow}>
            <button
              className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
              type="button"
              aria-expanded={isSignupOpen}
              aria-controls="ukdebt-signup"
              onClick={() => {
                setIsSignupOpen((open) => !open)
                setSignupStatus('idle')
                setSignupMessage('')
              }}
            >
              Stay Informed
            </button>
            <a
              className={`${styles.ctaButton} ${styles.ctaButtonSecondary}`}
              href="mailto:uk@logos.co"
            >
              Contact us
            </a>
          </div>
        </div>
        {isSignupOpen && (
          <form
            className={styles.ctaSignup}
            id="ukdebt-signup"
            onSubmit={handleSignupSubmit}
          >
            <label className={styles.ctaSignupLabel} htmlFor="ukdebt-email">
              Email
            </label>
            <input
              id="ukdebt-email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Enter email"
              value={email}
              disabled={signupStatus === 'loading'}
              onChange={(event) => setEmail(event.target.value)}
            />
            <button type="submit" disabled={signupStatus === 'loading'}>
              {signupStatus === 'loading' ? 'Submitting' : 'Subscribe'}
            </button>
            {signupMessage && (
              <p
                className={`${styles.ctaSignupMessage} ${
                  signupStatus === 'error' ? styles.ctaSignupError : ''
                }`}
                role={signupStatus === 'error' ? 'alert' : 'status'}
              >
                {signupMessage}
              </p>
            )}
          </form>
        )}
        <img src="/assets/logos-black.svg" alt="" aria-hidden="true" />
      </section>

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
    </div>
  )
}
