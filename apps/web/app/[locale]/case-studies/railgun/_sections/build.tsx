import { createCopyRenderer } from './copy-text'
import Image from 'next/image'
import { railgunImage } from '../assets'
import { ButtonArrowIcon, LogosMark } from '@acid-info/logos-ui'
import { ROUTES, EXTERNAL_URLS } from '@/constants/routes'
import { ResponsiveCopy } from './shared'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Build({ copy }: { copy: RailgunCopySection['build'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="light pad wrap" id="build">
        <div className="split">
          <div className="bphoto reveal rv">
            <picture>
              <source
                media="(max-width: 820px)"
                srcSet={railgunImage('glacier-mobile.jpg')}
              />
              <Image
                src={railgunImage('glacier.jpg')}
                width={962}
                height={768}
                alt={copy.photoAlt}
                loading="lazy"
              />
            </picture>
          </div>
          <div>
            <h2 className="h2" data-railgun-lines="heading">
              {text('logosIsOpenTo')}
            </h2>
            <div className="body" style={{ marginTop: '24px' }}>
              <p>{text('railgunNeededAWay', 'railgunNeededAWayMobile')}</p>
            </div>
          </div>
        </div>
        <div className="bcards">
          <div className="bcard lead">
            <h3 className="h3">{copy.useRailgun}</h3>
            <p className="small">{text('shieldTokensAndUse')}</p>
            <div className="acts">
              <a
                className="cta fill-ow cursor-pointer"
                href={EXTERNAL_URLS.railgunWallets}
              >
                {copy.pickAWallet}{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
            </div>
          </div>
          <div className="bcard">
            <h3 className="h3">{copy.buildOnLogos}</h3>
            <p className="small">
              <ResponsiveCopy
                desktop={copy.logosPackagesTheLogos}
                mobile={copy.logosPackagesTheLogosMobile}
              />
            </p>
            <div className="acts">
              <a className="cta fill cursor-pointer" href={EXTERNAL_URLS.docs}>
                {copy.readTheDocs}{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
            </div>
          </div>
          <div className="bcard">
            <h3 className="h3">{copy.installBasecamp}</h3>
            <p className="small">{text('runTheLogosStack')}</p>
            <div className="acts">
              <a className="cta fill cursor-pointer" href={ROUTES.basecamp}>
                {copy.installBasecamp}{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
            </div>
          </div>
          <div className="bcard">
            <h3 className="h3">{copy.developerProgrammes}</h3>
            <p className="small">{text('fundedRfpsAndThe')}</p>
            <div className="acts">
              <a className="cta fill cursor-pointer" href={ROUTES.rfps}>
                {copy.rfps}{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
              <a className="cta fill cursor-pointer" href={ROUTES.lambdaPrize}>
                <>
                  <LogosMark size={10} />
                  {copy.prize}
                </>{' '}
                <span className="arr">
                  <ButtonArrowIcon className={'railgun-arrow'} />
                </span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
