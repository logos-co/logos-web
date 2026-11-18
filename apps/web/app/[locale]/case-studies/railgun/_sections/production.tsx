import { BaseLogoIcon } from '@acid-info/logos-ui'
import { createCopyRenderer } from './copy-text'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import { railgunImage } from '../assets'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Production({
  copy,
}: {
  copy: RailgunCopySection['production']
}) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="light pad wrap" id="numbers">
        <div className="split">
          <div>
            <h2 className="h2" data-railgun-lines="heading">
              {text('aPrivateFeeMarket')}
            </h2>
            <div className="pills">
              <span className="pill">
                <Image
                  src={railgunImage('ethereum.svg')}
                  width={20}
                  height={20}
                  alt=""
                />
                {copy.ethereum}
              </span>
              <span className="pill">
                <Image
                  src={railgunImage('arbitrum.svg')}
                  width={20}
                  height={20}
                  alt=""
                />
                {copy.arbitrum}
              </span>
              <span className="pill">
                <Image
                  src={railgunImage('polygon.svg')}
                  width={20}
                  height={20}
                  alt=""
                />
                {copy.polygon}
              </span>
              <span className="pill">
                <BaseLogoIcon className="shrink-0" />
                {copy.base}
              </span>
              <span className="pill">
                <Image
                  src={railgunImage('bnb-chain.svg')}
                  width={20}
                  height={20}
                  alt=""
                />
                {copy.bnbChain}
              </span>
            </div>
          </div>
          <div className="body">
            <p>{text('everyTransactionSentThrough')}</p>
          </div>
        </div>
        <div className="stats4 stats96 rv">
          <div className="stat" style={{ '--d': '0ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label5b}</span>
            </span>
            <span className="lab">{text('cumulativeShieldedVolume')}</span>
          </div>
          <div className="stat" style={{ '--d': '70ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label112m}</span>
            </span>
            <span className="lab">{copy.valueLocked}</span>
          </div>
          <div className="stat" style={{ '--d': '170ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label47m}</span>
            </span>
            <span className="lab">{copy.annualisedProtocolFees}</span>
          </div>
          <div className="stat" style={{ '--d': '300ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label5}</span>
            </span>
            <span className="lab">{copy.chainsServed}</span>
          </div>
        </div>
        <figure className="qp rv" id="qp">
          <Image
            src={railgunImage('snowy-mountains-at-night.jpg')}
            width={1416}
            height={760}
            alt={copy.photoAlt}
            loading="lazy"
          />
        </figure>
        <div className="pair">
          <div>
            <h3 className="h3s" data-railgun-lines="heading">
              {copy.resilientAndDurable}
            </h3>
            <div className="body">
              <p>{text('any0xAddressCan')}</p>
            </div>
          </div>
          <div>
            <h3 className="h3s" data-railgun-lines="heading">
              {copy.whatComesNext}
            </h3>
            <span className="tagb">{copy.inProgress}</span>
            <div className="body">
              <p>{text('railgunIsThePrivacy')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
