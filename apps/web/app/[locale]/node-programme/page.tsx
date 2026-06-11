import Image from 'next/image'
import { getTranslations } from 'next-intl/server'
import type { ReactNode } from 'react'

import { LogosMark } from '@acid-info/logos-ui'

import ContentWidth from '@/components/layout/content-width'
import { Button, ButtonArrowIcon } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { createTranslatedPageMetadata } from '@/lib/translated-page-metadata'

import { NodeProgrammeSignupForm } from './node-programme-signup-form'

const NAMESPACE = 'pages.nodeProgramme'

export const generateMetadata = createTranslatedPageMetadata({
  namespace: NAMESPACE,
  path: ROUTES.nodeProgramme,
})

interface StackItem {
  title: string
  body: string
  icon: string
  alt: string
}

interface UseCaseItem {
  title: string
  body: string
}

function SectionShell({
  children,
  className = '',
  id,
}: Readonly<{
  children: ReactNode
  className?: string
  id?: string
}>) {
  return (
    <section
      id={id}
      className={`mx-auto w-full max-w-360 px-3 text-brand-dark-green ${className}`}
    >
      {children}
    </section>
  )
}

function HeroAnchorLink({
  children,
  href,
}: {
  children: ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      className="inline-flex cursor-pointer items-center justify-center text-brand-dark-green"
    >
      <span className="inline-flex items-center gap-1">
        <span className="border-b border-brand-dark-green/50 pb-0.5 font-mono text-[10px] leading-[1.35] font-semibold whitespace-nowrap uppercase">
          {children}
        </span>
        <ButtonArrowIcon />
      </span>
    </a>
  )
}

export default async function NodeProgramPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: NAMESPACE })
  const stackItems = t.raw('stack.items') as StackItem[]
  const useCases = t.raw('useCases.items') as UseCaseItem[]

  return (
    <main className="bg-brand-off-white">
      <section className="relative h-[483px] px-3 pt-6 text-brand-dark-green md:h-[487px]">
        <ContentWidth className="relative h-full">
          <div className="absolute top-6 left-3 h-[75px] w-[107px] overflow-hidden">
            <Image
              src="/images/node-programme/builders.jpg"
              alt=""
              width={133}
              height={75}
              className="h-[75px] w-[133px] -translate-x-[13px] object-cover"
              priority
            />
          </div>

          <p className="text-mono-s absolute top-6 left-[calc(50%+6px)] flex w-[calc(50%-18px)] max-w-[178px] items-center gap-3 md:left-1/2 md:w-[226px] md:max-w-none md:translate-x-[6px]">
            <LogosMark size={10} />
            {t('hero.eyebrow')}
          </p>

          <div className="absolute top-[279px] left-3 flex flex-col items-start gap-3 md:top-[11px] md:left-[83.33%] md:translate-x-[2px] md:gap-1.5">
            <HeroAnchorLink href="#node-programme-signup">
              {t('hero.cta')}
            </HeroAnchorLink>
            <Button
              href={ROUTES.technologyStack}
              variant="link"
              className="cursor-pointer"
            >
              {t('hero.secondaryCta')}
            </Button>
          </div>

          <h1 className="absolute top-[140px] left-1/2 w-[min(464px,calc(100vw-24px))] -translate-x-1/2 text-center font-display text-[40px] leading-[0.86] tracking-[-0.03em] text-brand-dark-green md:w-[640px] md:text-[56px]">
            {t('hero.title')}
          </h1>

          <p className="text-mono-s absolute top-[279px] left-[calc(50%+6px)] w-[calc(50%-18px)] max-w-[178px] md:top-[307px] md:left-1/2 md:w-[226px] md:max-w-none md:translate-x-[6px]">
            {t('hero.body')}
          </p>
        </ContentWidth>
      </section>

      <SectionShell className="grid gap-8 border-b border-brand-dark-green/10 py-10 md:grid-cols-12 md:gap-3 md:py-20">
        <div className="relative min-h-[280px] overflow-hidden rounded-xl md:col-span-6 md:min-h-[470px]">
          <Image
            src="/images/node-programme/builders.jpg"
            alt={t('builders.imageAlt')}
            fill
            priority
            sizes="(max-width: 768px) 100vw, 702px"
            className="object-cover"
          />
        </div>
        <div className="flex flex-col justify-between gap-12 md:col-span-5 md:col-start-8">
          <div>
            <p className="text-mono-s mb-5 flex items-center gap-3">
              <LogosMark size={10} />
              {t('builders.eyebrow')}
            </p>
            <h2 className="text-h3 max-w-[560px]">{t('builders.title')}</h2>
          </div>
          <p className="text-mono-s max-w-[486px]">{t('builders.body')}</p>
        </div>
      </SectionShell>

      <SectionShell className="grid gap-10 py-10 lg:grid-cols-12 lg:gap-3 lg:py-20">
        <h2 className="text-h3 lg:col-span-7">
          {t('stack.title')}{' '}
          <span className="text-brand-dark-green/45">
            {t('stack.titleMuted')}
          </span>
        </h2>
        <div className="divide-y divide-brand-dark-green/15 border-y border-brand-dark-green/15 lg:col-span-6 lg:col-start-7">
          {stackItems.map((item) => (
            <article
              key={item.title}
              className="grid gap-5 py-6 lg:grid-cols-6"
            >
              <Image
                src={item.icon}
                alt={item.alt}
                width={60}
                height={60}
                className="size-[50px] lg:size-[60px]"
              />
              <div className="grid gap-2 lg:col-span-5 lg:grid-cols-5">
                <h3 className="text-subhead-sans lg:col-span-2">
                  {item.title}
                </h3>
                <p className="text-body-s lg:col-span-3">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell className="border-t border-brand-dark-green/10 py-10 md:py-20">
        <h2 className="text-h3 max-w-[1040px]">
          {t('useCases.title')}{' '}
          <span className="text-brand-dark-green/45">
            {t('useCases.titleMuted')}
          </span>
        </h2>
        <div className="mt-10 grid gap-3 md:grid-cols-3 lg:grid-cols-5">
          {useCases.map((item, index) => (
            <article
              key={item.title}
              className="flex min-h-[220px] flex-col justify-between rounded-xl bg-gray-01 p-4"
            >
              <span className="text-mono-s text-brand-dark-green/55">
                {String(index + 1).padStart(2, '0')}
              </span>
              <div className="grid gap-3">
                <h3 className="text-subhead-sans">{item.title}</h3>
                <p className="text-body-s">{item.body}</p>
              </div>
            </article>
          ))}
        </div>
      </SectionShell>

      <SectionShell id="node-programme-signup" className="py-3 pb-10">
        <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden rounded-xl px-3 py-16 text-brand-dark-green md:min-h-[680px]">
          <Image
            src="/images/node-programme/woods.jpg"
            alt={t('signup.imageAlt')}
            fill
            sizes="(max-width: 768px) 100vw, 1416px"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-brand-off-white/15" />
          <div className="relative z-10 mx-auto flex w-full max-w-[720px] flex-col items-center gap-6 text-center">
            <h2 className="text-h2 text-brand-dark-green">
              {t('signup.title')}
            </h2>
            <NodeProgrammeSignupForm />
          </div>
        </div>
      </SectionShell>
    </main>
  )
}
