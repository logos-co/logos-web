import { createCopyRenderer } from './copy-text'
import type { CSSProperties } from 'react'
import Image from 'next/image'
import { railgunImage } from '../assets'
import { BrandLockup } from './shared'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Basics({ copy }: { copy: RailgunCopySection['basics'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="light pad wrap basics" id="basics">
        <div className="blk">
          <div>
            <span className="mark" aria-label={copy.railgun}>
              <Image
                className="railgun-wordmark"
                src={railgunImage('wordmark-dark.svg')}
                width={116}
                height={20}
                alt="RAILGUN"
              />
            </span>
            <h2 className="h3">
              {copy.poweringPrivateDefiOn}
              <br className="d" /> {copy.blockchains}
            </h2>
            <div className="body w600">
              <p>{text('railgunIsASet')}</p>
            </div>
          </div>
          <div className="tl" style={{ paddingTop: '48px' }}>
            <div className="row">
              <span className="k">{copy.label2021}</span>
              <span className="small">{copy.railgunGoesLiveOn}</span>
            </div>
            <div className="row">
              <span className="k">{copy.feb2023}</span>
              <span className="small">
                {text('railgunPublishesItsRelayer')}
              </span>
            </div>
            <div className="row">
              <span className="k">{copy.label2024}</span>
              <span className="small">
                {text('relayersAreRenamedBroadcasters')}
              </span>
            </div>
            <div className="row">
              <span className="k">{copy.today}</span>
              <span className="small">{text('wakuIsNowLogos')}</span>
            </div>
          </div>
        </div>
        <div className="blk">
          <div>
            <span
              className="mark"
              aria-label={copy.logos}
              style={{ fontSize: '26px' }}
            >
              <BrandLockup markSize={24} />
            </span>
            <h2 className="h3">
              {copy.aPeerToPeer}
              <br className="d" /> {copy.builtForPrivacy}
            </h2>
            <div className="body w600">
              <p>{text('logosDeliveryIsA')}</p>
            </div>
          </div>
          <div className="tl steps" style={{ paddingTop: '58px' }}>
            <div className="row">
              <span className="small">
                <b>{copy.findsABroadcaster}</b>
                {copy.broadcastersPostTheirFees}
              </span>
            </div>
            <div className="row">
              <span className="small">
                <b>{copy.deliversTheRequest}</b>
                {text('theSealedTransactionReaches')}
              </span>
            </div>
            <div className="row">
              <span className="small">
                <b>{copy.bringsBackTheResult}</b>
                {text('theBroadcasterRepliesEncrypted')}
              </span>
            </div>
          </div>
        </div>
        <p className="bookend lines rv">
          <span className="ln">
            <span style={{ '--d': '0ms' } as CSSProperties}>
              {copy.railgunSProofsProtect}
            </span>
          </span>
          <span className="ln">
            <span style={{ '--d': '140ms' } as CSSProperties}>
              {copy.logosDeliverySecuresTransmission}
            </span>
          </span>
        </p>
      </section>
    </>
  )
}
