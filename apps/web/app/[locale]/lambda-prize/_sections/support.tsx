import ContentWidth from '@/components/layout/content-width'
import { ROUTES } from '@/constants/routes'

import { TertiaryCta } from './atoms'
import type { LambdaPrizePageCopy } from './types'

export function Support({ copy }: { copy: LambdaPrizePageCopy['support'] }) {
  return (
    <section className="h-[406px] bg-brand-off-white px-3 py-10 text-brand-dark-green min-[1025px]:h-[421px] min-[1025px]:py-12">
      <ContentWidth>
        <div className="grid grid-cols-[1fr_auto] gap-y-6 min-[1025px]:grid-cols-3">
          <h2 className="text-h3-serif w-fit border-b border-brand-dark-green/10 pb-1">{copy.heading}</h2>
          <p className="text-mono-s col-start-1 row-start-2 w-[178px] min-[1025px]:col-start-auto min-[1025px]:row-start-auto min-[1025px]:w-[226px]">
            {copy.body}
          </p>
          <div className="col-start-2 row-start-1 min-[1025px]:col-start-auto min-[1025px]:row-start-auto">
            <TertiaryCta href={ROUTES.faq}>{copy.cta}</TertiaryCta>
          </div>
        </div>
        <div className="mt-6 min-[1025px]:mt-8">
          {copy.rows.map((row, index) => (
            <div
              key={row.label}
              className={`grid h-[58px] grid-cols-[1fr_83px] items-start px-3 py-3 min-[1025px]:h-[50px] min-[1025px]:grid-cols-[714fr_464fr_238fr] ${
                index % 2 === 0 ? 'bg-gray-01' : 'bg-brand-dark-green/5'
              }`}
            >
              <div className="flex gap-3">
                <p className="text-body-sans w-[18px] font-medium">
                  {String(index + 1).padStart(2, '0')}
                </p>
                <h3 className="text-body-serif">{row.label}</h3>
              </div>
              <p className="text-mono-s hidden max-w-[312px] min-[1025px]:block">
                {row.body}
              </p>
              <div><TertiaryCta href={ROUTES.faq}>{row.action}</TertiaryCta></div>
            </div>
          ))}
        </div>
      </ContentWidth>
    </section>
  )
}
