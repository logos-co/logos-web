'use client'

import { useState } from 'react'
import { ButtonArrowIcon } from '@acid-info/logos-ui'

import { Link } from '@/i18n/navigation'
import { ROUTES } from '@/constants/routes'

import { Lines, Cta, Photo, Tag, type RfpCopy } from './atoms'
import type { ProgrammeRfp } from './rfp-items'

type Filter = 'open' | 'closed' | 'all'

export function OpenRfps({
  copy,
  items,
}: {
  copy: RfpCopy['listing']
  items: ProgrammeRfp[]
}) {
  const [filter, setFilter] = useState<Filter>(
    items.some((item) => item.status !== 'closed') ? 'open' : 'all'
  )
  const visible = items.filter(
    (item) =>
      filter === 'all' ||
      (filter === 'closed'
        ? item.status === 'closed'
        : item.status !== 'closed')
  )
  const curated = copy.featured.flatMap((feature) =>
    visible
      .filter((item) => item.number === feature.id)
      .map((item) => ({ ...item, ...feature }))
  )
  const featured =
    curated.length > 0
      ? curated
      : visible.slice(0, 3).map((item, index) => ({
          ...item,
          image: copy.featured[index]!.image,
          body: item.summary,
        }))
  const remaining = visible.filter(
    (item) => !featured.some((feature) => feature.number === item.number)
  )
  const counts = {
    open: items.filter((item) => item.status !== 'closed').length,
    closed: items.filter((item) => item.status === 'closed').length,
    all: items.length,
  }
  return (
    <section id="open-rfps" className="rfp-open rfp-section">
      <div className="rfp-listing-heading">
        <p className="rfp-eyebrow">{copy.eyebrow}</p>
        <h2>{copy.heading}</h2>
        <p className="rfp-mono rfp-listing-body">
          <Lines>{copy.body.replace('{count}', String(items.length))}</Lines>
        </p>
        <div className="rfp-thesis">
          <Cta link={copy.thesisCta} variant="tertiary" />
        </div>
        <div className="rfp-filters" role="group" aria-label={copy.heading}>
          {(['open', 'closed', 'all'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={filter === value}
              onClick={() => setFilter(value)}
              className="rfp-filter cursor-pointer rfp-mono"
            >
              {copy.filters[value]} · {counts[value]}
            </button>
          ))}
        </div>
      </div>
      <div aria-live="polite" aria-atomic="false">
        {visible.length === 0 && <p className="rfp-empty">{copy.empty}</p>}
        {featured.length > 0 && (
          <div
            className={`rfp-card-grid${featured.length === 2 ? ' rfp-card-grid-two' : ''}`}
          >
            {featured.map((item) => (
              <article className="rfp-card" key={item.number}>
                <div className="rfp-card-photo">
                  <Photo image={item.image} />
                  <Tag outline={item.status !== 'open'}>
                    {copy.statuses[item.status]} · {item.tier}
                  </Tag>
                </div>
                <div className="rfp-card-copy">
                  <p className="rfp-eyebrow">{item.number}</p>
                  <h3>{item.title}</h3>
                  <p className="rfp-small">
                    <Lines>{item.body}</Lines>
                  </p>
                  <Tag outline>{item.category.replace(/&/g, 'and')}</Tag>
                </div>
                <div className="rfp-card-bottom">
                  <p className="rfp-mono">{copy.statuses[item.status]}</p>
                  <Cta
                    link={{
                      label: copy.learnMore,
                      href: `${ROUTES.rfps}/${item.slug}`,
                    }}
                    variant="tertiary"
                  />
                </div>
              </article>
            ))}
          </div>
        )}
        {remaining.length > 0 && (
          <details className="rfp-other-rfps" open={featured.length === 0}>
            <summary className="cursor-pointer rfp-mono">
              {copy.moreLabel.replace('{count}', String(remaining.length))}
            </summary>
            <ul>
              {remaining.map((item) => (
                <li key={item.number}>
                  <Link
                    className="cursor-pointer"
                    href={`${ROUTES.rfps}/${item.slug}`}
                  >
                    <span className="rfp-mono">{item.number}</span>
                    <span>{item.title}</span>
                    <span className="rfp-mono">
                      {copy.statuses[item.status]} · {item.tier}
                    </span>
                    <ButtonArrowIcon />
                  </Link>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="rfp-actions">
        <Cta link={copy.submitCta} />
        <Cta link={copy.githubCta} variant="secondary" />
      </div>
    </section>
  )
}
