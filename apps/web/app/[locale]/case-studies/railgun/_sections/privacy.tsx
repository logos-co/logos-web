import { createCopyRenderer } from './copy-text'
import Image from 'next/image'
import { railgunImage } from '../assets'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Privacy({ copy }: { copy: RailgunCopySection['privacy'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="grey pad wrap" id="privacy">
        <div className="split">
          <div>
            <h2 className="h2" data-railgun-lines="heading">
              {text('privacyThroughDecentralisation')}
            </h2>
            <div className="body w600" style={{ marginTop: '40px' }}>
              <p>{text('aRailgunCompatibleWallet')}</p>
              <p>{text('railgunHandsYourTransaction')}</p>
            </div>
          </div>
          <div className="cards4">
            <div className="card">
              <h4 className="h4">{copy.broadcasters}</h4>
              <p className="small">{copy.publicWalletsSubmitTransactions}</p>
            </div>
            <div className="card">
              <h4 className="h4">{copy.feeQuotes}</h4>
              <p className="small">{copy.announcedOnOpenTopics}</p>
            </div>
            <div className="card">
              <h4 className="h4">{copy.sealedRequests}</h4>
              <p className="small">{copy.readableByOneBroadcaster}</p>
            </div>
            <div className="card">
              <h4 className="h4">{copy.encryptedReplies}</h4>
              <p className="small">{text('successOrFailureNotifications')}</p>
            </div>
          </div>
        </div>
        <div className="band reveal rv">
          <Image
            src={railgunImage('valley.jpg')}
            width={1914}
            height={822}
            alt={copy.photoAlt}
            loading="lazy"
          />
        </div>
        <div className="split lower">
          <div>
            <h3 className="h4">{copy.whyRailgunChoseLogos}</h3>
            <p className="small" style={{ maxWidth: '560px' }}>
              {text('railgunFirstTriedBuilding')}
            </p>
            <p className="problem">{text('ifThisCoordinationPassed')}</p>
          </div>
          <div>
            <h3 className="h4">{copy.whatAServerWould}</h3>
            <div className="seen">
              <span>{copy.yourIpAddress}</span>
              <span>{copy.whenYouSend}</span>
              <span>{copy.howOftenYouSend}</span>
              <span>{copy.whichBroadcasterYouChose}</span>
              <span>{copy.whichChainYouUse}</span>
              <span>{copy.whichTokenPaysYour}</span>
            </div>
            <p className="cap">{text('railgunSProofsProtect')}</p>
          </div>
        </div>
      </section>
    </>
  )
}
