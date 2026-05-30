import type { TechStackOverviewSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

function formatEyebrow(eyebrow: string) {
  return eyebrow.replaceAll('. ', '.\n')
}

function splitTechStackTitle(title: string): [string, string] {
  const parts = title.split(' Technology Stack')
  return [parts[0], 'Technology Stack']
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
      className="relative min-h-[1516px] overflow-hidden border-t border-brand-dark-green/10 bg-brand-off-white md:min-h-[1653px]"
    >
      <ContentWidth className="relative min-h-full flex-col pt-3 pb-[100px] md:hidden">
        <div className="flex items-start justify-between">
          <p className="text-mono-s w-[226px] text-brand-dark-green">
            Disclaimer: This diagram oversimplifies the stack.
          </p>

          <div className="flex flex-col items-end gap-1.5">
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
        </div>

        <div className="mt-[127px] flex flex-col items-center gap-[109px]">
          {data.eyebrow ? (
            <p className="text-mono-s w-[120px] whitespace-pre-line text-center text-brand-dark-green">
              {formatEyebrow(data.eyebrow)}
            </p>
          ) : null}

          {data.title ? (
            <h2 className="text-h2 w-full text-center text-brand-dark-green">
              {(() => {
                const [first, second] = splitTechStackTitle(data.title)
                return (
                  <>
                    {first}
                    <br />
                    {second}
                  </>
                )
              })()}
            </h2>
          ) : null}

          <p className="text-mono-s w-[178px] text-center text-brand-dark-green">
            Private-by-default infrastructure is a requirement to make parallel
            societies possible.
          </p>

          <div className="w-full">
            <TechStackDiagram
              data={data}
              networkingHref={networkingHref}
              foundationHref={foundationHref}
            />
          </div>
        </div>
      </ContentWidth>

      <ContentWidth className="relative hidden min-h-full flex-col pt-[11px] pb-[100px] md:flex">
          <div className="flex items-start justify-between">
            <p className="text-mono-s w-[226px] text-brand-dark-green">
              Disclaimer: Abstract representation of the stack.
            </p>

            <div className="flex items-center gap-1.5">
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
          </div>

          <div className="mt-[86px] flex flex-col items-center gap-[149px]">
            {data.eyebrow ? (
              <p className="text-mono-s w-[226px] whitespace-pre-line text-center text-brand-dark-green">
                {formatEyebrow(data.eyebrow)}
              </p>
            ) : null}

            {data.title ? (
              <h2 className="text-h2 w-[464px] whitespace-pre-line text-center text-brand-dark-green">
                {data.title}
              </h2>
            ) : null}

            <p className="text-mono-s w-[226px] text-center text-brand-dark-green">
              Private-by-default infrastructure is a requirement to make parallel
              societies possible.
            </p>

            <div className="w-full">
              <TechStackDiagram
                data={data}
                networkingHref={networkingHref}
                foundationHref={foundationHref}
              />
            </div>
          </div>
        </ContentWidth>
    </section>
  )
}
