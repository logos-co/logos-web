import { renderToStaticMarkup } from 'react-dom/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import {
  CMS_PRESS_ORIGIN,
  getBlogArticleDetail,
  type BlogArticleDetail,
} from '@/lib/blog-content'
import { absoluteUrl } from '@/lib/metadata'

import ArticlePage, { generateMetadata } from '../page'

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}))
vi.mock('@/lib/blog-content', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/blog-content')>()),
  getBlogArticleDetail: vi.fn(),
}))
vi.mock('@/lib/media-image-manifest', () => ({
  withLocalMediaImages: (article: BlogArticleDetail) => article,
}))
vi.mock('../_sections/article-detail-page', () => ({
  ArticleDetailPage: () => null,
}))

const coverImage = {
  url: `${CMS_PRESS_ORIGIN}/uploads/cover.jpg`,
  width: 1774,
  height: 887,
  alt: '',
}
const ogImage = {
  url: `${CMS_PRESS_ORIGIN}/uploads/og.jpg`,
  width: 1200,
  height: 630,
  alt: '',
}

const article: BlogArticleDetail = {
  type: 'article',
  id: '165',
  slug: 'interview',
  title: 'Interview',
  summary: 'An interview.',
  publishedAt: '2026-10-26T16:00:00.000Z',
  modifiedAt: '2026-10-26T16:00:00.000Z',
  createdAt: '2026-10-26T16:00:00.000Z',
  tags: [],
  authors: [],
  coverImage,
  ogImage,
  readingTime: 1,
  toc: [],
  footnotes: [],
  relatedArticles: [],
  articlesFromSameAuthors: [],
}
const pageProps = () => ({
  params: Promise.resolve({ locale: 'en', slug: article.slug }),
})

async function expectSocialImage(url: string) {
  const metadata = await generateMetadata(pageProps())
  expect(metadata.openGraph).toMatchObject({ images: [{ url }] })
  expect(metadata.twitter).toMatchObject({ images: [url] })

  const html = renderToStaticMarkup(await ArticlePage(pageProps()))
  const scripts = [...html.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
  const articleJsonLd = scripts
    .map(([, body]) => JSON.parse(body!) as Record<string, unknown>)
    .find((entry) => entry['@type'] === 'Article')
  expect(articleJsonLd?.image).toBe(url)
}

beforeEach(() => {
  vi.mocked(getBlogArticleDetail).mockResolvedValue(article)
})

describe('article social images', () => {
  it('preserves a valid CMS OG image', async () => {
    await expectSocialImage(ogImage.url)
  })

  it.each([
    { width: 0, height: 0 },
    { width: 0, height: 630 },
    { width: 1200, height: 0 },
  ])(
    'uses the cover when the OG dimensions are $width x $height',
    async (dimensions) => {
      vi.mocked(getBlogArticleDetail).mockResolvedValue({
        ...article,
        ogImage: { ...ogImage, ...dimensions },
      })
      await expectSocialImage(coverImage.url)
    }
  )

  it('uses the cover when there is no OG image', async () => {
    vi.mocked(getBlogArticleDetail).mockResolvedValue({
      ...article,
      ogImage: null,
    })
    await expectSocialImage(coverImage.url)
  })

  it('keeps the site image fallback when neither image is available', async () => {
    vi.mocked(getBlogArticleDetail).mockResolvedValue({
      ...article,
      ogImage: null,
      coverImage: null,
    })
    const metadata = await generateMetadata(pageProps())
    expect(metadata.openGraph).toMatchObject({
      images: [{ url: absoluteUrl('/og.jpeg') }],
    })
    const html = renderToStaticMarkup(await ArticlePage(pageProps()))
    expect(html).not.toContain('"image":')
  })
})
