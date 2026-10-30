import { LogosMark } from '@acid-info/logos-ui'
import type { LambdaPrizeCopySection } from '@repo/content/schemas'

import { Link } from '@/i18n/navigation'

import { Cta, Lines } from './atoms'
import { Picture } from './picture'

export function Hero({ copy }: { copy: LambdaPrizeCopySection['hero'] }) {
  return (
    <section className="lp-hero" aria-labelledby="lambda-title">
      <div className="lp-hero-meta">
        <p className="lp-eyebrow">
          <Link href={copy.breadcrumb.href} className="cursor-pointer">
            {copy.breadcrumb.label}
          </Link>{' '}
          / {copy.breadcrumbCurrent}
        </p>
        <nav aria-label={copy.breadcrumbCurrent} className="lp-jump-links">
          {copy.jumpLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="lp-eyebrow cursor-pointer"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="lp-hero-intro">
        <h1 id="lambda-title" className="lp-title">
          <LogosMark
            size={113.4}
            width="0.58909em"
            height="0.81em"
            viewBox="0 0 19.1176 26"
            preserveAspectRatio="none"
          />
          <span className="sr-only">Lambda </span>
          <span>{copy.title}</span>
        </h1>
        <div className="lp-intro-copy">
          <p className="lp-sans-title lp-hero-heading">{copy.heading}</p>
          <p className="lp-small lp-muted">
            <Lines>{copy.body}</Lines>
          </p>
          <div className="lp-actions">
            <Cta link={copy.primaryCta} />
            <Cta link={copy.secondaryCta} variant="secondary" />
          </div>
        </div>
      </div>
      <div className="lp-stadium">
        <Picture
          image={copy.image}
          sizes="(min-width: 1440px) 1416px, (min-width: 768px) 100vw, 768px"
          priority
        />
        <div className="lp-stadium-shade" />
        <dl className="lp-stats">
          {copy.stats.map((stat) => (
            <div key={stat.id} className={`lp-stat lp-stat-${stat.id}`}>
              <dt className="lp-eyebrow">{stat.label}</dt>
              <dd className="lp-display">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  )
}
