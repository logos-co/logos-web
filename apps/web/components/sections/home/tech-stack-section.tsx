import type { TechStackOverviewSection } from '@repo/content/schemas'

import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

function formatEyebrow(eyebrow: string) {
  return eyebrow.replaceAll('. ', '.\n')
}

type Props = {
  data: TechStackOverviewSection
  /**
   * Where the networking row links to. Page-level concern (the section
   * fixture covers the four pillars; the networking row is a shared link
   * across pages).
   */
  networkingHref: string
  /** Where the foundation row links to. */
  foundationHref: string
}

export default function TechStackSection({
  data,
  networkingHref,
  foundationHref,
}: Props) {
  return (
    <section
      id="tech-stack"
      className="relative h-[1516px] overflow-hidden border-t border-brand-dark-green/10 bg-brand-off-white md:h-[1653px]"
    >
      <div className="relative h-full px-3 md:hidden">
        <p className="text-mono-s absolute top-3 left-3 w-[226px] text-brand-dark-green">
          Disclaimer: This diagram oversimplifies the stack.
        </p>

        {data.eyebrow ? (
          <p className="text-mono-s absolute top-[130px] left-[203px] w-[120px] whitespace-pre-line text-brand-dark-green">
            {formatEyebrow(data.eyebrow)}
          </p>
        ) : null}

        <div className="absolute top-3 right-3 flex flex-col items-end gap-1.5">
          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="secondary"
              icon={<ButtonArrowIcon />}
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              Documentation
            </Button>
          ) : null}
          <Button
            href={ROUTES.buildersHub}
            icon={<ButtonArrowIcon />}
            className="cursor-pointer transition-opacity hover:opacity-70"
          >
            Builder Hub
          </Button>
        </div>

        {data.title ? (
          <h2 className="text-h2 absolute top-[193px] left-1/2 w-[464px] -translate-x-1/2 whitespace-pre-line text-center text-brand-dark-green">
            {data.title}
          </h2>
        ) : null}

        <p className="text-mono-s absolute top-[302px] left-[250px] w-[178px] text-brand-dark-green">
          Private-by-default infrastructure is a requirement to make parallel
          societies possible.
        </p>

        <div className="absolute top-[437px] right-3 left-3">
          <TechStackDiagram
            data={data}
            networkingHref={networkingHref}
            foundationHref={foundationHref}
          />
        </div>
      </div>

      <div className="relative mx-auto hidden h-full max-w-[1440px] md:block">
        <p className="text-mono-s absolute top-[11px] left-3 w-[226px] text-brand-dark-green">
          Disclaimer: Abstract representation of the stack.
        </p>

        {data.eyebrow ? (
          <p className="text-mono-s absolute top-[97px] left-[calc(50%+6px)] w-[226px] whitespace-pre-line text-brand-dark-green">
            {formatEyebrow(data.eyebrow)}
          </p>
        ) : null}

        <div className="absolute top-[11px] right-3 flex items-center gap-1.5">
          <Button
            href={ROUTES.buildersHub}
            icon={<ButtonArrowIcon />}
            className="cursor-pointer transition-opacity hover:opacity-70"
          >
            Builder Hub
          </Button>
          {data.cta ? (
            <Button
              href={data.cta.href}
              variant="secondary"
              icon={<ButtonArrowIcon />}
              className="cursor-pointer transition-opacity hover:opacity-70"
            >
              Documentation
            </Button>
          ) : null}
          <Button
            href={ROUTES.technologyStack}
            variant="secondary"
            icon={<ButtonArrowIcon />}
            className="cursor-pointer transition-opacity hover:opacity-70"
          >
            Specs
          </Button>
        </div>

        {data.title ? (
          <div className="absolute top-[184px] left-[calc(33.33%+8px)] w-[464px]">
            <h2 className="text-h2 whitespace-pre-line text-center text-brand-dark-green">
              {data.title}
            </h2>
          </div>
        ) : null}

        <p className="text-mono-s absolute top-[333px] left-[calc(50%+6px)] w-[226px] text-brand-dark-green">
          Private-by-default infrastructure is a requirement to make parallel
          societies possible.
        </p>

        <div className="absolute top-[517px] left-0 w-full px-3">
          <TechStackDiagram
            data={data}
            networkingHref={networkingHref}
            foundationHref={foundationHref}
          />
        </div>
      </div>
    </section>
  )
}
