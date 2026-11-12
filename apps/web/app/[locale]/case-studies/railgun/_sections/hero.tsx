import { createCopyRenderer } from './copy-text'
import Image from 'next/image'
import { railgunImage } from '../assets'
import { BrandLockup } from './shared'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Hero({ copy }: { copy: RailgunCopySection['hero'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section
        className="hero"
        id="top"
        aria-label={copy.railgunUsesLogosTo}
        data-header-tone="dark"
      >
        <div className="stage" id="stage">
          <div className="lockrow wrap">
            <span className="lockup">
              <span className="lg">
                <BrandLockup />
              </span>
              <span className="x">×</span>
              <Image
                className="railgun-wordmark"
                src={railgunImage('wordmark-light.svg')}
                width={139}
                height={24}
                alt="RAILGUN"
              />
            </span>
          </div>
          <div className="ph">
            <Image
              src={railgunImage('cover.jpg')}
              width={1672}
              height={941}
              alt={copy.photoAlt}
              preload
            />
            <span className="veil"></span>
            <i className="hl" id="hl"></i>
          </div>
          <div className="base wrap">
            <h1 className="h1 lines" data-railgun-lines="hero">
              {text('heading')}
            </h1>
            <p className="meta">{text('inProductionSince2023')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
