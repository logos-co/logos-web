'use client'

import { useState } from 'react'
import { LogosMark } from '@acid-info/logos-ui'
import type { Renewal } from './atoms'
import { Lines, LinkButton } from './atoms'
import { InstallLink } from './install-link'

export function Apps({ copy }: { copy: Renewal['apps'] }) {
  const [filter, setFilter] = useState(copy.filters[0])
  const cards =
    filter === copy.filters[0]
      ? copy.cards
      : copy.cards.filter((card) =>
          card.uses.toLowerCase().includes(filter.toLowerCase())
        )
  return (
    <section id="run-apps" className="bc-light bc-apps">
      <div className="bc-section-header">
        <div>
          <h2>
            <Lines lines={copy.title} />
          </h2>
          <p className="bc-apps-description">{copy.description}</p>
        </div>
        <div className="bc-filters">
          {copy.filters.map((item) => {
            const isActive = item === filter
            return (
              <button
                type="button"
                className={`cursor-pointer ${isActive ? 'is-active' : ''}`}
                aria-pressed={isActive}
                onClick={() => setFilter(item)}
                key={item}
              >
                {item}
              </button>
            )
          })}
        </div>
      </div>
      <div className="bc-app-grid">
        {cards.map((card) => (
          <article className="bc-app-card" key={card.title}>
            <div className="bc-app-art">
              <div>
                {card.initial === 'λ' ? <LogosMark size={30} /> : card.initial}
              </div>
            </div>
            <div className="bc-app-info">
              <h3>{card.title}</h3>
              <p>{card.description}</p>
              <small>{card.uses}</small>
              <div className="bc-app-actions">
                <a href={card.action.href} className="cursor-pointer">
                  {card.action.label}
                </a>
                <a href={card.guide.href} className="cursor-pointer">
                  {card.guide.label}
                </a>
              </div>
            </div>
          </article>
        ))}
        <div className="bc-install-card">
          <div className="bc-install-card-top">
            <small>{copy.installCard.eyebrow}</small>
            <h3>
              <Lines lines={copy.installCard.title} />
            </h3>
          </div>
          <div className="bc-install-card-bottom">
            <p>{copy.installCard.platforms}</p>
            <InstallLink
              cta={copy.installCard.action}
              className="bc-button-orange"
            />
          </div>
        </div>
      </div>
      <div className="bc-community">
        <div className="bc-community-intro">
          <small>{copy.community.eyebrow}</small>
          <h2>
            <Lines lines={copy.community.title} />
          </h2>
          <p>{copy.community.description}</p>
          <LinkButton
            href={copy.community.action.href}
            className="bc-button-orange"
          >
            {copy.community.action.label}
          </LinkButton>
          <small>{copy.community.disclaimer}</small>
        </div>
        <div className="bc-community-grid">
          {copy.community.cards.map((card) => (
            <div key={card.title}>
              <b>{card.initial}</b>
              <strong>{card.title}</strong>
              <span>{card.description}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
