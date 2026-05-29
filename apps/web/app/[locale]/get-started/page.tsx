import Image from 'next/image'
import type { ReactNode } from 'react'
import { getTranslations } from 'next-intl/server'
import { LogosMark } from '@acid-info/logos-ui'

import { Button, ButtonArrowIcon } from '@/components/ui/button'
import { EXTERNAL_URLS, ROUTES } from '@/constants/routes'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

const NAMESPACE = 'pages.getStarted'

const docs = [
  { key: 'architecture', href: EXTERNAL_URLS.docs },
  { key: 'blockchain', href: EXTERNAL_URLS.docs },
  { key: 'messaging', href: EXTERNAL_URLS.docs },
  { key: 'storage', href: EXTERNAL_URLS.docs },
  { key: 'api', href: EXTERNAL_URLS.docs },
] as const

const communityLinks = [
  { key: 'forum', href: EXTERNAL_URLS.forum },
  { key: 'research', href: EXTERNAL_URLS.forum },
  { key: 'discord', href: EXTERNAL_URLS.discord },
  { key: 'xLogosNetwork', href: EXTERNAL_URLS.twitter },
  { key: 'xLogosDevs', href: EXTERNAL_URLS.twitter },
  { key: 'youtubeTutorials', href: EXTERNAL_URLS.youtube },
] as const

const buildItems = [
  { key: 'node', ctaKey: 'nodeCta', href: ROUTES.nodeProgramme, hasBody: true },
  {
    key: 'messaging',
    ctaKey: 'messagingCta',
    href: ROUTES.messaging,
    hasBody: true,
  },
  { key: 'lez', ctaKey: 'deployCta', href: ROUTES.blockchain, hasBody: true },
  {
    key: 'storage',
    ctaKey: 'tryItOutCta',
    href: ROUTES.storage,
    hasBody: true,
  },
  { key: 'atomicSwaps', ctaKey: 'cta', href: EXTERNAL_URLS.github },
  { key: 'zkMultiSig', ctaKey: 'cta', href: EXTERNAL_URLS.github },
  { key: 'scaffold', ctaKey: 'scaffoldCta', href: EXTERNAL_URLS.github },
] as const

interface SectionHeadingProps {
  number: string
  heading: string
}

interface ActionLinkProps {
  children: ReactNode
  href: string
  variant?: 'primary' | 'secondary'
  className?: string
}

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.getStarted,
})

function SectionHeading({ number, heading }: SectionHeadingProps) {
  return (
    <h2 className="flex items-baseline gap-3 text-[24px] leading-[1.1] tracking-[-0.24px]">
      <span className="font-display text-brand-dark-green/50">{number}</span>
      <span className="font-sans text-brand-dark-green">{heading}</span>
    </h2>
  )
}

function ActionLink({
  children,
  href,
  variant = 'secondary',
  className,
}: ActionLinkProps) {
  const isExternal = href.startsWith('http')

  if (!isExternal) {
    return (
      <Button
        href={href}
        variant={variant}
        className={`cursor-pointer ${className ?? 'w-fit'}`}
      >
        {children}
      </Button>
    )
  }

  const classes =
    variant === 'primary'
      ? 'inline-flex cursor-pointer items-center justify-center rounded-xl bg-brand-dark-green px-3 py-2 text-brand-off-white backdrop-blur-[5px]'
      : 'inline-flex cursor-pointer items-center justify-center rounded-[4px] border border-brand-dark-green/50 px-3 py-2 text-brand-dark-green backdrop-blur-[5px]'

  return (
    <a
      className={`${classes} ${className ?? 'w-fit'}`}
      href={href}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="inline-flex items-center gap-1">
        <span className="font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
          {children}
        </span>
        <ButtonArrowIcon />
      </span>
    </a>
  )
}

export default async function GetStartedPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: NAMESPACE })

  return (
    <div className="bg-brand-off-white text-brand-dark-green">
      <section className="relative mb-[60px] h-[200px] w-full px-3 md:mb-[100px] md:h-[258px]">
        <div className="absolute top-[60px] left-3 flex items-center gap-3 md:top-[90px]">
          <LogosMark size={26} className="w-5 shrink-0" />
          <h1 className="font-display text-[30px] leading-none tracking-[-0.9px] md:text-[36px] md:tracking-[-1.08px]">
            {t('heading')}
          </h1>
        </div>
        <p className="absolute top-[126px] left-3 max-w-[342px] whitespace-pre-line font-mono text-[10px] leading-[1.3] md:top-[90px] md:left-[calc(50%+6px)] md:max-w-[345px]">
          {t('intro')}
        </p>
      </section>

      <section
        id="install"
        className="border-t border-brand-dark-green/10 px-3 pt-6 pb-[100px] md:pt-10"
      >
        <div className="flex w-full flex-col gap-10">
          <SectionHeading
            number={t('sections.install.number')}
            heading={t('sections.install.heading')}
          />
          <div className="grid overflow-hidden rounded-xl bg-gray-01 p-1.5 md:min-h-[325px] md:grid-cols-2">
            <div className="relative min-h-[314px] overflow-hidden rounded-md md:min-h-full">
              <Image
                src="/images/builders-hub/basecamp-card.png"
                alt={t('sections.install.imageAlt')}
                fill
                priority
                sizes="(max-width: 768px) 100vw, 690px"
                className="object-cover object-left"
              />
            </div>
            <div className="flex min-h-[227px] flex-col items-center justify-center gap-6 px-6 py-10 text-center md:min-h-full">
              <div className="flex max-w-[345px] flex-col items-center gap-3">
                <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.18px]">
                  {t('sections.install.cardTitle')}
                </h3>
                <p className="font-mono text-[10px] leading-[1.3]">
                  {t('sections.install.body')}
                </p>
              </div>
              <ActionLink href={ROUTES.links}>
                {t('sections.install.cta')}
              </ActionLink>
            </div>
          </div>
        </div>
      </section>

      <section className="border-t border-brand-dark-green/10 px-3 pt-6 pb-[100px]">
        <div className="flex w-full flex-col gap-10">
          <div className="grid gap-6 md:grid-cols-12 md:items-start">
            <div className="md:col-span-5">
              <SectionHeading
                number={t('sections.docs.number')}
                heading={t('sections.docs.heading')}
              />
            </div>
            <p className="font-mono text-[10px] leading-[1.3] md:col-span-3">
              {t('sections.docs.body')}
            </p>
            <div className="md:col-span-4 md:flex md:justify-end">
              <ActionLink href={EXTERNAL_URLS.docs}>
                {t('sections.docs.cta')}
              </ActionLink>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-5">
            {docs.map((doc) => (
              <article
                key={doc.key}
                className="flex min-h-[200px] flex-col items-center justify-between rounded-xl bg-accent-light-blue px-4 pt-[60px] pb-3 text-center md:min-h-[237px]"
              >
                <div className="flex flex-col items-center gap-3">
                  <h3 className="font-sans text-[18px] leading-[1.15] tracking-[-0.18px]">
                    {t(`sections.docs.items.${doc.key}.title`)}
                  </h3>
                  <p className="max-w-[222px] font-mono text-[10px] leading-[1.3]">
                    {t(`sections.docs.items.${doc.key}.body`)}
                  </p>
                </div>
                <ActionLink href={doc.href} className="w-full">
                  {t('sections.docs.cardCta')}
                </ActionLink>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-dark-green/10 px-3 pt-6 pb-[100px]">
        <div className="flex w-full flex-col gap-10">
          <SectionHeading
            number={t('sections.community.number')}
            heading={t('sections.community.heading')}
          />
          <div className="flex flex-col">
            {communityLinks.map((item, index) => (
              <a
                key={item.key}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex h-[62px] cursor-pointer items-center justify-between px-3 transition-colors hover:bg-accent-light-blue md:h-[50px] md:px-4 ${
                  index % 2 === 0 ? 'bg-brand-dark-green/5' : 'bg-gray-01'
                }`}
              >
                <span className="font-mono text-[10px] leading-[1.3]">
                  {String(index + 1).padStart(2, '0')}{' '}
                  {t(`sections.community.items.${item.key}`)}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
                  {t('sections.community.cta')}
                  <ButtonArrowIcon />
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-brand-dark-green/10 px-3 pt-6 pb-[100px]">
        <div className="flex w-full flex-col gap-10">
          <SectionHeading
            number={t('sections.build.number')}
            heading={t('sections.build.heading')}
          />
          <div className="grid gap-3 md:grid-cols-3">
            {buildItems.map((item) => {
              return (
                <article
                  key={item.key}
                  className="flex min-h-[200px] flex-col justify-between rounded-xl bg-gray-01 p-4 md:min-h-[250px]"
                >
                  <div className="flex flex-col gap-3">
                    <h3 className="font-sans text-[24px] leading-[1.1] tracking-[-0.24px]">
                      {t(`sections.build.items.${item.key}.title`)}
                    </h3>
                    {'hasBody' in item && item.hasBody ? (
                      <p className="max-w-[360px] font-mono text-[10px] leading-[1.3]">
                        {t(`sections.build.items.${item.key}.body`)}
                      </p>
                    ) : null}
                  </div>
                  <ActionLink
                    href={item.href}
                    variant="primary"
                    className="w-fit self-start"
                  >
                    {t(`sections.build.${item.ctaKey}`)}
                  </ActionLink>
                </article>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}
