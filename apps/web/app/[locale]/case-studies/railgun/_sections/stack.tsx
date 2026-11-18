import { createCopyRenderer } from './copy-text'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Stack({ copy }: { copy: RailgunCopySection['stack'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="light pad wrap" id="fig">
        <div className="split">
          <h2 className="h2" data-railgun-lines="heading">
            {text('howRailgunBuiltLogos')}
          </h2>
          <div className="body">
            <p>{text('railgunSBroadcasterClient')}</p>
          </div>
        </div>
        <div className="fig">
          <div className="fig-top">
            <button
              className="cta line play cursor-pointer"
              id="playbtn"
              type="button"
              aria-live="polite"
            >
              <span
                id="playlab"
                data-steps={JSON.stringify([
                  copy.replayStep1,
                  copy.replayStep2,
                  copy.replayStep3,
                  copy.replayStep4,
                ])}
                data-rest={copy.replayLabel}
              >
                {copy.replayLabel}
              </span>
              <span className="st" id="playst"></span>
            </button>
          </div>
          <div className="cols" id="cols">
            <div className="col">
              <span className="mono">{copy.userSDevice}</span>
              <div className="node r1" id="n-wallet">
                <b>{copy.railgunWallet}</b>
                <span>{copy.buildsTheZkProof}</span>
              </div>
              <div className="vgap a" id="va">
                <span className="lab">{copy.proof}</span>
                <span className="pkt"></span>
              </div>
              <div className="node r2" id="n-client">
                <b>{copy.broadcasterClient}</b>
                <span>
                  <span className="desktop-copy">
                    {copy.aLogosDeliveryLight}
                    <br /> {copy.filterHearsFeesAnd}
                    <br /> {copy.lightpushSendsTheRequest}
                    <br /> {copy.storeFetchesWhatIt}
                  </span>
                  <span className="mobile-copy">{copy.clientMobile}</span>
                </span>
              </div>
              <div className="vgap"></div>
              <div className="node r3">
                <b>{copy.noServerOfIts}</b>
                <span>{copy.packagesForTheBrowser}</span>
              </div>
            </div>
            <div className="conn" id="c1">
              <span className="track"></span>
              <span className="tag desktop-copy">
                {copy.label1Fees}
                <br />
                {copy.label2Request}
                <br />
                {copy.label4Result}
              </span>
              <span className="tag mobile-copy">{copy.connectionMobile}</span>
              <span className="pkt"></span>
            </div>
            <div className="col mid">
              <span className="mono">{copy.logosDelivery}</span>
              <div className="node r1">
                <b>{copy.serviceNodes}</b>
                <span>{text('relayMessagesAcrossThe')}</span>
              </div>
              <div className="vgap"></div>
              <div className="node r2" id="n-topics">
                <b>{copy.railgunContentTopics}</b>
                <span>{copy.threePerChainEthereum}</span>
                <code>
                  {copy.railgunV201}
                  <br />
                  {copy.railgunV2012}
                  <br />
                  {copy.railgunV2013}
                </code>
              </div>
              <div className="vgap"></div>
              <div className="node r3">
                <b>{copy.railgunSDeliveryNetwork}</b>
                <span>{text('aClusterOfDelivery')}</span>
              </div>
            </div>
            <div className="conn" id="c2">
              <span className="track"></span>
              <span className="tag desktop-copy">
                {copy.label1Fees}
                <br />
                {copy.label2Request}
                <br />
                {copy.label4Result}
              </span>
              <span className="tag mobile-copy">{copy.connectionMobile}</span>
              <span className="pkt"></span>
            </div>
            <div className="col">
              <span className="mono">{copy.broadcaster}</span>
              <div className="node r1" id="n-poi">
                <b>{copy.privatePoiNode}</b>
                <span>{copy.syncsTheProofsA}</span>
              </div>
              <div className="vgap a" id="vb">
                <span className="lab">{copy.poiData}</span>
                <span className="pkt"></span>
              </div>
              <div className="node r2" id="n-service">
                <b>{copy.broadcasterService}</b>
                <span>
                  <span className="desktop-copy">
                    {copy.nodeJsPlusA}
                    <br /> {copy.signsFeeQuotesWith}
                    <br /> {copy.triesToDecryptEvery}
                    <br /> {copy.checksTheFeeAnd}
                  </span>
                  <span className="mobile-copy">{copy.serviceMobile}</span>
                </span>
              </div>
              <div className="vgap a" id="vc">
                <span className="pkt"></span>
              </div>
              <div className="node r3" id="n-0x">
                <b>{copy.label0xWallet}</b>
                <span>{copy.signsTheTransactionAnd}</span>
              </div>
            </div>
          </div>
          <div className="chain" id="chain">
            <div>
              <span className="mono">{copy.onChain}</span>
              <p
                className="small"
                style={{ marginTop: '22px', maxWidth: '380px' }}
              >
                {text(
                  'ethereumArbitrumPolygonAnd',
                  'ethereumArbitrumPolygonAndMobile'
                )}
              </p>
            </div>
            <div className="node" id="n-contracts">
              <b>{copy.railgunSmartContracts}</b>
              <span>{copy.verifyTheProofUpdate}</span>
            </div>
          </div>
          <span className="vconn" id="v3">
            <span className="lab">{copy.label3SubmitPayGas}</span>
            <span className="pkt"></span>
          </span>
          <p className="figcap">
            {text('arrowsIntoTheLight', 'arrowsIntoTheLightMobile')}
          </p>
        </div>
      </section>
    </>
  )
}
