import { ButtonArrowIcon } from '@acid-info/logos-ui'
import { BrandLockup } from './shared'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Gateway({ copy }: { copy: RailgunCopySection['gateway'] }) {
  return (
    <>
      <div
        className="nextpage wrap"
        id="nextpage"
        inert
        role="dialog"
        aria-modal="true"
        aria-label={copy.nextCaseStudyGateway}
        aria-hidden="true"
      >
        <div className="np-top">
          <span className="lockup sm">
            <BrandLockup markSize={13} /> <span aria-hidden="true">×</span>{' '}
            <span className="mono">{copy.gateway}</span>
          </span>
          <button className="cta line cursor-pointer" id="back" type="button">
            <span className="arr">
              <ButtonArrowIcon className={'railgun-arrow rotate-180'} />
            </span>{' '}
            {copy.backToRailgun}
          </button>
        </div>
        <div className="np-body">
          <span className="np-sub np-lab">{copy.nextCaseStudy}</span>
          <h2 id="nphead">{copy.gatewayFm}</h2>
          <p className="body np-sub" style={{ opacity: 0.75 }}>
            {copy.howGatewayFmRuns}
          </p>
        </div>
      </div>
    </>
  )
}
