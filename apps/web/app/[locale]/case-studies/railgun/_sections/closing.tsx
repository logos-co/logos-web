import { createCopyRenderer } from './copy-text'
import { ButtonArrowIcon } from '@acid-info/logos-ui'
import { ROUTES } from '@/constants/routes'
import type { RailgunCopySection } from '@repo/content/schemas'

export function Closing({ copy }: { copy: RailgunCopySection['closing'] }) {
  const text = createCopyRenderer(copy)
  return (
    <>
      <section className="dark closer wrap" id="closer">
        <p className="h3">{text('aParallelSocietyNeeds')}</p>
        <div className="sentence" id="sentence">
          <div className="left">
            {copy.private}
            <br />
            {copy.payments}
          </div>
          <div className="mid" aria-hidden="true">
            <i></i>
            <b className="l"></b>
            <b className="r"></b>
          </div>
          <div className="right">
            {copy.shouldNotNeed}
            <br />
            <span className="r2">{copy.permission}</span>
          </div>
        </div>
        <div className="closing-cta">
          <a className="cta fill cursor-pointer" href={ROUTES.prifi}>
            {copy.readThePrifiThesis}{' '}
            <span className="arr">
              <ButtonArrowIcon className={'railgun-arrow'} />
            </span>
          </a>
        </div>
        <button
          className="next cursor-pointer"
          id="nextlink"
          type="button"
          aria-controls="nextpage"
          aria-haspopup="dialog"
        >
          <span>{copy.nextCaseStudy}</span>
          <span className="to">
            <span className="name">{copy.gatewayFm}</span>
            <span className="arr">
              <ButtonArrowIcon className={'railgun-arrow'} />
            </span>
          </span>
        </button>
      </section>
    </>
  )
}
