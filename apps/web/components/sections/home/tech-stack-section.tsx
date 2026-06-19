import type { TechStackOverviewSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import { Button, ButtonArrowIcon, type ButtonVariant } from '@/components/ui'
import { ROUTES } from '@/constants/routes'

function formatEyebrow(eyebrow: string) {
  return eyebrow.replaceAll('. ', '.\n')
}

function splitTechStackTitle(title: string): [string, string] {
  const parts = title.split(' Technology Stack')
  return [parts[0], 'Technology Stack']
}

const TECH_STACK_BODY =
  'Private-by-default infrastructure for people who need secure coordination and do not trust existing platforms to provide it.'

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
  /** Keep the compact layout through tablet widths on pages that need it. */
  desktopAt1367?: boolean
  /** Hide the hairline above the section on pages that don't want it. */
  borderTop?: boolean
  /** Override the top margin when the section is attached to the previous band. */
  flushTop?: boolean
  ctas?: readonly {
    label: string
    href: string
    variant?: ButtonVariant
  }[]
}

export default function TechStackSection({
  data,
  networkingHref,
  foundationHref,
  desktopAt1367 = false,
  borderTop = true,
  flushTop = false,
  ctas,
}: Props) {
  const compactContentClass = desktopAt1367
    ? 'min-[1367px]:hidden'
    : 'md:hidden'

  const desktopContentClass = desktopAt1367 ? 'min-[1367px]:flex' : 'md:flex'
  const renderCustomCtas = () =>
    ctas?.map((cta) => (
      <Button
        key={`${cta.href}-${cta.label}`}
        href={cta.href}
        variant={cta.variant}
        icon={<ButtonArrowIcon />}
        className="cursor-pointer transition-opacity hover:opacity-70"
      >
        {cta.label}
      </Button>
    ))

  return (
    <section
      id="tech-stack"
      className={`relative overflow-hidden bg-brand-off-white ${
        flushTop ? '' : 'lg:mt-[224px]'
      } ${
        borderTop ? 'border-t border-brand-dark-green/10' : ''
      }`}
    >
      <ContentWidth
        className={`relative min-h-full flex-col pt-3 pb-25 ${compactContentClass}`}
      >
        <div className="flex items-start justify-between">
          <p className="text-mono-s w-[226px] text-brand-dark-green">
            Disclaimer: This diagram oversimplifies the stack.
          </p>

          {ctas ? (
            <div className="flex flex-col items-end gap-1.5">
              {renderCustomCtas()}
            </div>
          ) : (
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
          )}
        </div>

        <div className="mt-[70px] flex flex-col items-center gap-10">
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
            {TECH_STACK_BODY}
          </p>

          <div className="mt-[60px] w-full">
            <TechStackDiagram
              data={data}
              networkingHref={networkingHref}
              foundationHref={foundationHref}
              desktopAt1367={desktopAt1367}
            />
          </div>
        </div>
      </ContentWidth>

      <ContentWidth
        className={`relative hidden min-h-full flex-col pt-[11px] pb-[34px] ${desktopContentClass}`}
      >
        <div className="flex items-start justify-between">
          <p className="text-mono-s w-[226px] text-brand-dark-green">
            Disclaimer: Abstract representation of the stack.
          </p>

          {ctas ? (
            <div className="flex items-center gap-1.5">
              {renderCustomCtas()}
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Button
                href={ROUTES.buildersHub}
                icon={<ButtonArrowIcon />}
                className="cursor-pointer transition-opacity hover:opacity-70"
              >
                Builder Hub
              </Button>
              <Button
                href={ROUTES.getStarted}
                variant="secondary"
                icon={<ButtonArrowIcon />}
                className="cursor-pointer transition-opacity hover:opacity-70"
              >
                Start Building
              </Button>
              <Button
                href={ROUTES.technologyStack}
                variant="secondary"
                icon={<ButtonArrowIcon />}
                className="cursor-pointer transition-opacity hover:opacity-70"
              >
                Specs
              </Button>
            </div>
          )}
        </div>

        <div className="mt-[73px] flex flex-col items-center gap-[73px]">
          {data.eyebrow ? (
            <div className="relative h-[301px] w-[464px]">
              <p className="text-mono-s absolute top-[-3px] left-[238px] w-[226px] whitespace-pre-line text-left text-brand-dark-green">
                {formatEyebrow(data.eyebrow)}
              </p>

              {data.title ? (
                <h2 className="text-h2 absolute top-[84px] left-1/2 w-[464px] -translate-x-1/2 whitespace-pre-line text-center text-brand-dark-green">
                  {data.title}
                </h2>
              ) : null}

              <p className="text-mono-s absolute top-[233px] left-[238px] w-[226px] text-left text-brand-dark-green">
                {TECH_STACK_BODY}
              </p>
            </div>
          ) : null}

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
