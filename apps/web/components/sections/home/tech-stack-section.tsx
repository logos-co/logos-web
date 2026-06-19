import type { TechStackOverviewSection } from '@repo/content/schemas'

import ContentWidth from '@/components/layout/content-width'
import { TechStackDiagram } from '@/components/sections/shared/tech-stack-diagram'
import { Button, ButtonArrowIcon, type ButtonVariant } from '@/components/ui'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'

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
  const sectionCtas: NonNullable<Props['ctas']> = ctas ?? [
    {
      label: 'Start Building',
      href: ROUTES.getStarted,
    },
    {
      label: data.cta?.label ?? 'View the docs',
      href: data.cta?.href ?? EXTERNAL_URLS.docs,
      variant: 'secondary',
    },
  ]
  const renderCtas = () =>
    sectionCtas.map((cta) => (
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

          <div className="flex flex-col items-end gap-1.5">{renderCtas()}</div>
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

          <div className="flex items-center gap-1.5">{renderCtas()}</div>
        </div>

        <div className="mt-[73px] flex flex-col items-center gap-[73px]">
          {data.eyebrow ? (
            <div className="flex w-[464px] flex-col items-center">
              <p className="text-mono-s w-[226px] self-end whitespace-pre-line text-left text-brand-dark-green">
                {formatEyebrow(data.eyebrow)}
              </p>

              {data.title ? (
                <h2 className="text-h2 mt-12 w-[464px] whitespace-pre-line text-center text-brand-dark-green">
                  {data.title}
                </h2>
              ) : null}

              <p className="text-mono-s mt-12 w-[226px] self-end text-left text-brand-dark-green">
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
