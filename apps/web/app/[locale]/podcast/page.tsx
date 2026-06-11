import { getTranslations } from 'next-intl/server'
import { isActiveLocale } from '@repo/content/locales'
import { LogosMark } from '@acid-info/logos-ui'

import { ROUTES } from '@/constants/routes'
import { createDefaultMetadata } from '@/lib/metadata'
import ContentWidth from '@/components/layout/content-width'
import { BLOG_ORIGIN, getLatestBlogPodcasts } from '@/lib/blog-engine'

import { PodcastsSection } from '../media/_sections/podcasts'

interface PodcastIntroCopy {
  title: string
  description: string
  hostedBy: string
}

function PodcastIntro({ copy }: { copy: PodcastIntroCopy }) {
  return (
    <section className="h-[246px] bg-accent-tan px-3 pt-20 text-brand-dark-green md:h-[282px] md:pt-20">
      <ContentWidth className="grid w-full gap-6 md:grid-cols-12">
        <div className="flex items-center gap-3 md:col-span-5">
          <LogosMark size={20} className="shrink-0" />
          <h1 className="font-display text-[30px] leading-none tracking-[-0.03em] md:text-[36px]">
            {copy.title}
          </h1>
        </div>
        <div className="text-mono-s flex min-w-0 flex-col justify-between text-black md:col-start-7 md:col-end-10 md:h-auto md:gap-6">
          <p className="line-clamp-6 break-words md:line-clamp-none">
            {copy.description}
          </p>
          <p>{copy.hostedBy}</p>
        </div>
      </ContentWidth>
    </section>
  )
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: 'pages.podcast' })
  return createDefaultMetadata({
    title: t('title'),
    description: t('description'),
    locale,
    path: ROUTES.podcast,
  })
}

export default async function LogosPodcastPage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale } = await params
  if (!isActiveLocale(locale)) {
    throw new Error(`LogosPodcastPage received non-active locale "${locale}"`)
  }

  const [t, blogT, podcasts] = await Promise.all([
    getTranslations({ locale, namespace: 'pages.podcast' }),
    getTranslations({ locale, namespace: 'pages.blog.podcasts' }),
    getLatestBlogPodcasts(20),
  ])

  if (podcasts.length === 0) {
    throw new Error('Podcast page requires at least one podcast from blog API')
  }

  return (
    <div className="overflow-hidden bg-accent-tan pb-10">
      <PodcastIntro
        copy={{
          title: t('heading'),
          description: t('intro.description'),
          hostedBy: t('intro.hostedBy'),
        }}
      />
      <PodcastsSection
        podcasts={podcasts}
        ctaHref={`${BLOG_ORIGIN}/podcasts`}
        copy={{
          heading: t('latestHeading'),
          media: t('eyebrow'),
          heroTitle: podcasts[0].title,
          heroDescription: podcasts[0].description,
          latestEpisode: t('latestEpisode'),
          seeAllEpisodes: t('seeAllEpisodes'),
          listenOnApp: t('listenOnApp'),
          cta: blogT('cta'),
          episodePrefix: t('episodePrefix'),
          fallbackEpisode: t('fallbackEpisode'),
        }}
      />
    </div>
  )
}
