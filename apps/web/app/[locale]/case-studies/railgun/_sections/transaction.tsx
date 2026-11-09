import { createCopyRenderer } from './copy-text'
import { ButtonArrowIcon } from '@acid-info/logos-ui'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Transaction({
  copy,
}: {
  copy: RailgunCopySection['transaction']
}) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="dark pad wrap how" id="how" data-header-tone="dark">
        <div className="split">
          <h2 className="h2" data-railgun-lines="heading">
            {text('howAPrivateTransaction')}
          </h2>
          <div className="body">
            <p>{text('allCommunicationBetweenUsers')}</p>
          </div>
        </div>
        <div className="howtrack" id="howtrack">
          <div className="howgrid" id="howgrid">
            <div
              className="diagram"
              id="diagram"
              data-wallet={copy.wallet}
              data-broadcasters={copy.broadcasters}
              data-receiver={copy.receiver}
            >
              <svg id="dsvg" viewBox="0 0 702 640" aria-hidden="true" />
              <div className="dcapwrap">
                <span
                  className="dcap"
                  id="dcap"
                  aria-live="polite"
                  data-mobile-caption={copy.lineBreaks?.mobile?.caption0}
                  data-captions={JSON.stringify([
                    copy.caption0,
                    copy.caption1,
                    copy.caption2,
                    copy.caption3,
                    copy.caption4,
                  ])}
                >
                  {copy.caption0}
                </span>
              </div>
            </div>
            <div className="ctrl">
              <div className="tabs" role="tablist" aria-label={copy.fiveSteps}>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  id="t0"
                  aria-selected="true"
                  aria-controls="p0"
                  tabIndex={0}
                >
                  <span className="bar">
                    <i></i>
                  </span>
                  <span className="nm">{copy.announce}</span>
                </button>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  id="t1"
                  aria-selected="false"
                  aria-controls="p1"
                  tabIndex={-1}
                >
                  <span className="bar">
                    <i></i>
                  </span>
                  <span className="nm">{copy.choose}</span>
                </button>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  id="t2"
                  aria-selected="false"
                  aria-controls="p2"
                  tabIndex={-1}
                >
                  <span className="bar">
                    <i></i>
                  </span>
                  <span className="nm">{copy.encrypt}</span>
                </button>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  id="t3"
                  aria-selected="false"
                  aria-controls="p3"
                  tabIndex={-1}
                >
                  <span className="bar">
                    <i></i>
                  </span>
                  <span className="nm">{copy.gossip}</span>
                </button>
                <button
                  className="tab cursor-pointer"
                  role="tab"
                  id="t4"
                  aria-selected="false"
                  aria-controls="p4"
                  tabIndex={-1}
                >
                  <span className="bar">
                    <i></i>
                  </span>
                  <span className="nm">{copy.reply}</span>
                </button>
              </div>
              <div className="panel" id="panel">
                <div
                  className="pane"
                  role="tabpanel"
                  id="p0"
                  aria-labelledby="t0"
                >
                  <h3 className="h3 t">{copy.announce}</h3>
                  <div className="b">
                    <p>{text('eachBroadcasterSignsIts')}</p>
                    <p className="out">{text('noOneCanTell')}</p>
                  </div>
                </div>
                <div
                  className="pane"
                  role="tabpanel"
                  id="p1"
                  aria-labelledby="t1"
                  hidden
                >
                  <h3 className="h3 t">{copy.choose}</h3>
                  <div className="b">
                    <p>{copy.theWalletKeepsA}</p>
                    <p className="out">{copy.yourPlanStaysOn}</p>
                  </div>
                </div>
                <div
                  className="pane"
                  role="tabpanel"
                  id="p2"
                  aria-labelledby="t2"
                  hidden
                >
                  <h3 className="h3 t">{copy.encrypt}</h3>
                  <div className="b">
                    <p>{copy.theWalletBuildsThe}</p>
                    <p className="out">{copy.transactionDetailsAreKept}</p>
                  </div>
                </div>
                <div
                  className="pane"
                  role="tabpanel"
                  id="p3"
                  aria-labelledby="t3"
                  hidden
                >
                  <h3 className="h3 t">{copy.gossip}</h3>
                  <div className="b">
                    <p>{copy.logosDeliverySLightpush}</p>
                    <p className="out">{copy.messageSourceAndDestination}</p>
                  </div>
                </div>
                <div
                  className="pane"
                  role="tabpanel"
                  id="p4"
                  aria-labelledby="t4"
                  hidden
                >
                  <h3 className="h3 t">{copy.reply}</h3>
                  <div className="b">
                    <p>{copy.theBroadcasterEncryptsThe}</p>
                    <p className="out">{copy.transactionStatusIsReturned}</p>
                  </div>
                </div>
              </div>
              <div className="nextrow">
                <button
                  className="cta line cursor-pointer"
                  id="nextstep"
                  type="button"
                >
                  <span
                    id="nextlab"
                    data-next={copy.nextStepLabel}
                    data-back={copy.backToStart}
                  >
                    {copy.initialNextStep}
                  </span>
                  <span className="arr">
                    <ButtonArrowIcon className={'railgun-arrow'} />
                  </span>
                </button>
                <span className="hint" id="hint">
                  {copy.scrollClickAStep}{' '}
                  <ButtonArrowIcon className="railgun-arrow" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
