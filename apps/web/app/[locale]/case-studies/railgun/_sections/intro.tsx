import { createCopyRenderer } from './copy-text'
import type { CSSProperties } from 'react'
import { ButtonArrowIcon } from '@acid-info/logos-ui'
import { railgunAnchors } from '../anchors'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Intro({ copy }: { copy: RailgunCopySection['intro'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="intro dark wrap">
        <div className="split">
          <p className="lead">{text('railgunIsASystem')}</p>
          <div className="side">
            <div className="body">
              <p>{text('toCoordinateTheseTransactions')}</p>
            </div>
            <div className="ctas">
              <a
                className="cta fill cursor-pointer"
                href={railgunAnchors.build}
              >
                {copy.useRailgun}{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
              <a
                className="cta line cursor-pointer"
                href={railgunAnchors.build}
              >
                {copy.buildOnLogos}{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
            </div>
          </div>
        </div>
        <div className="stats4 rv">
          <div className="stat" style={{ '--d': '0ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label3Yrs}</span>
            </span>
            <span className="lab">{text('railgunSBroadcasterNetwork')}</span>
          </div>
          <div className="stat" style={{ '--d': '70ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label567b}</span>
            </span>
            <span className="lab">
              {text(
                'cumulativePrivacySetTokens',
                'cumulativePrivacySetTokensMobile'
              )}
            </span>
          </div>
          <div className="stat" style={{ '--d': '170ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.label0Eth}</span>
            </span>
            <span className="lab">
              {text('neededToPayGas', 'neededToPayGasMobile')}
            </span>
          </div>
          <div className="stat" style={{ '--d': '300ms' } as CSSProperties}>
            <span className="nv">
              <span>{copy.n}</span>
            </span>
            <span className="lab">
              {text(
                'privateTransactionsRelayedOver',
                'privateTransactionsRelayedOverMobile'
              )}
            </span>
          </div>
        </div>
      </section>
    </>
  )
}
