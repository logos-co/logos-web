import { createCopyRenderer } from './copy-text'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Prifi({ copy }: { copy: RailgunCopySection['prifi'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="grey pad wrap" id="prifi">
        <div className="split">
          <h2 className="h2" data-railgun-lines="heading">
            {text('builtIntoRailgunLogos')}
          </h2>
          <div className="body">
            <p>{text('toEnablePrivateFinance')}</p>
            <p>{text('everyTransactionHasEight')}</p>
            <p>
              {text(
                'railgunUsesLogosDelivery',
                'railgunUsesLogosDeliveryMobile'
              )}
            </p>
            <p>{text('railgunSProofsSecure')}</p>
          </div>
        </div>
        <div className="life rv" id="life">
          <div className="stages">
            {copy.stages.map((stage, index) => (
              <span key={`${index}-${stage}`}>{stage}</span>
            ))}
          </div>
          <div className="lline">
            <svg id="lsvg" aria-hidden="true" />
          </div>
          <div className="spans">
            <div className="span live">
              <span className="mono">{copy.liveInRailgun}</span>
              <h3 className="h3">{copy.logosDelivery}</h3>
              <p className="small">
                {text(
                  'discoveryQuotesAndRequests',
                  'discoveryQuotesAndRequestsMobile'
                )}
              </p>
            </div>
            <div className="span test">
              <span className="mono">{copy.onTestnet}</span>
              <h3 className="h3">
                {copy.blendAndPrivate}
                <br className="d" /> {copy.settlement2}
              </h3>
              <p className="small">
                {text('blendHidesWhereA', 'blendHidesWhereAMobile')}
              </p>
            </div>
            <div className="span dev">
              <span className="mono">{copy.inDevelopment}</span>
              <h3 className="h3">{copy.logosZones}</h3>
              <p className="small">
                {text(
                  'privateEnforcementForTerms',
                  'privateEnforcementForTermsMobile'
                )}
              </p>
            </div>
          </div>
          <p className="h3 closing">
            {text('logosBuildsPrivacyAcross')}
            <br className="d" /> {copy.logosDeliveryIsOne}
            <br className="d" /> {copy.liveInRailgunAnd}
          </p>
        </div>
      </section>
    </>
  )
}
