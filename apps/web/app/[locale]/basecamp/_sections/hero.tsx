'use client'

import Image from 'next/image'

import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { HeroAppWindow } from './hero-app-window'
import { InstallLink } from './install-link'

export function Hero({
  copy,
  badges,
  releaseTag,
}: {
  copy: Renewal['hero']
  badges: readonly string[]
  releaseTag: string
}) {
  return (
    <section className="bc-hero">
      <div className="bc-hero-inner">
        <div className="bc-hero-copy">
          <div className="bc-badges">
            {badges.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <h1>
            <Lines lines={copy.title} />
          </h1>
          <p className="bc-hero-description">{copy.description}</p>
          <p className="bc-hero-statement">{copy.statement}</p>
          <div className="bc-actions">
            <InstallLink cta={copy.install} className="bc-button-orange" />
            <LinkButton href={copy.versions.href} className="bc-button-outline">
              {copy.versions.label}
            </LinkButton>
          </div>
          <div className="bc-platforms">
            {copy.platforms.map((platform) => (
              <span key={platform.label}>
                <i className={platform.available ? 'bc-available' : ''} />
                {platform.label}
              </span>
            ))}
          </div>
        </div>
        <div className="bc-hero-visual">
          <Image
            src={`${asset}/hero-glow.svg`}
            alt=""
            width={1100}
            height={820}
            className="bc-hero-glow"
          />
          <HeroAppWindow
            copy={copy}
            releaseTag={releaseTag}
            testnetBadge={badges[1] ?? ''}
          />
        </div>
      </div>
    </section>
  )
}
