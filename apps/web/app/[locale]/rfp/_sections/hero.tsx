import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

import { Cta, Photo, Tag, type RfpCopy } from './atoms'
import type { ProgrammeRfp } from './rfp-items'

export function Hero({
  copy,
  listing,
  items,
}: {
  copy: RfpCopy['hero']
  listing: RfpCopy['listing']
  items: ProgrammeRfp[]
}) {
  const active = items.filter((item) => item.status !== 'closed')
  const featured =
    active.length > 0
      ? active.slice(0, 3)
      : listing.featured.flatMap(({ id }) =>
          items.filter((item) => item.number === id)
        )
  return (
    <section className="rfp-hero">
      <div className="rfp-hero-meta">
        <p className="rfp-eyebrow">
          <Link className="cursor-pointer" href={copy.breadcrumb.href}>
            {copy.breadcrumb.label}
          </Link>{' '}
          / {copy.breadcrumbCurrent}
        </p>
        <nav
          className="rfp-jump-links rfp-eyebrow"
          aria-label={copy.breadcrumbCurrent}
        >
          {copy.jumpLinks.map((link) => (
            <a className="cursor-pointer" key={link.href} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
      <div className="rfp-hero-grid">
        <div className="rfp-hero-intro">
          <h1 className="rfp-display rfp-title">{copy.title}</h1>
          <p className="rfp-hero-heading">{copy.heading}</p>
          <div className="rfp-actions">
            <Cta link={copy.primaryCta} />
            <Cta link={copy.secondaryCta} variant="secondary" />
          </div>
        </div>
        <div className="rfp-hero-photo">
          <Photo image={copy.image} priority />
          <span className="rfp-photo-caption">
            <Tag>{copy.caption}</Tag>
          </span>
        </div>
        <dl className="rfp-stats">
          <div>
            <dt className="rfp-eyebrow">{copy.publishedLabel}</dt>
            <dd className="rfp-display">{items.length}</dd>
          </div>
          {copy.stats.map((stat) => (
            <div key={stat.label}>
              <dt className="rfp-eyebrow">{stat.label}</dt>
              <dd className="rfp-display">{stat.value}</dd>
            </div>
          ))}
        </dl>
        <aside className="rfp-status" aria-label={copy.statusHeading}>
          <div className="rfp-status-items">
            {featured.map((item) => (
              <div key={item.number}>
                <Tag outline={item.status !== 'open'}>
                  {listing.statuses[item.status]}
                </Tag>
                <Link
                  className="cursor-pointer"
                  href={`${ROUTES.rfps}/${item.slug}`}
                >
                  {item.number} {item.title}
                </Link>
              </div>
            ))}
          </div>
          <Cta link={copy.notifyCta} variant="secondary" />
        </aside>
      </div>
    </section>
  )
}
