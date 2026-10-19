import Image from 'next/image'
import type { Renewal } from './atoms'
import { asset, Lines, LinkButton } from './atoms'
import { InstallLink } from './install-link'

export function Hero({ copy }: { copy: Renewal['hero'] }) {
  return (
    <section className="bc-hero">
      <div className="bc-hero-inner">
        <div className="bc-hero-copy">
          <div className="bc-badges">
            {copy.badges.map((label) => (
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
          <div className="bc-product-window">
            <div className="bc-product-titlebar">
              <div>
                <i />
                <i />
                <i />
              </div>
              <span>{copy.windowTitle}</span>
            </div>
            <Image
              src={`${asset}/hero-product.png`}
              alt={copy.windowAlt}
              width={1510}
              height={948}
              priority
              className="bc-hero-product"
            />
          </div>
          <div className="bc-status">
            <span className="bc-status-dot" />
            {copy.status}
          </div>
        </div>
      </div>
    </section>
  )
}
