import { describe, expect, test } from 'vitest'

import type { RelatedArticlesSection } from '@repo/content/schemas'

import type { BlogArticleRow } from '@/lib/blog-engine'
import {
  TECH_STACK_RELATED_ARTICLE_TAGS,
  getTechStackRelatedArticleCards,
} from '@/lib/tech-stack-related-articles'

const section: RelatedArticlesSection = {
  componentType: 'relatedArticles',
  key: 'blockchain.relatedArticles',
  title: 'Related Articles',
  items: [
    {
      title: 'State of the Logos Network: November 2025',
      image: {
        src: '/images/blockchain/related/state-november.webp',
        alt: '',
        width: 678,
        height: 904,
      },
      date: '02.14.26',
      author: 'Sterlin Lujan',
      readingTime: 6,
      href: '/blog',
    },
  ],
  visibleCount: 1,
}

const latestArticle: BlogArticleRow = {
  title: 'Latest Logos Network Update',
  date: '04 Jun 2026',
  galleryDate: '06.04.26',
  author: 'Logos',
  description: 'Latest article',
  image: 'https://cms-press.logos.co/uploads/large-latest.jpg',
  thumbnailImage: 'https://cms-press.logos.co/uploads/thumbnail-latest.jpg',
  galleryImage: 'https://cms-press.logos.co/uploads/small-latest.jpg',
  cardImage: 'https://cms-press.logos.co/uploads/large-latest.jpg',
  featuredImage: 'https://cms-press.logos.co/uploads/latest.jpg',
  href: 'https://blog.logos.co/article/latest-logos-network-update',
  readingTime: 4,
}

describe('tech-stack related articles', () => {
  test('maps each tech-stack page to a blog search tag', () => {
    expect(TECH_STACK_RELATED_ARTICLE_TAGS).toEqual({
      blockchain: 'Blockchain',
      messaging: 'Messaging',
      networking: 'Logos_stack',
      storage: 'Storage',
    })
  })

  test('renders latest topic articles instead of content fixture items', () => {
    expect(getTechStackRelatedArticleCards(section, [latestArticle])).toEqual([
      {
        title: 'Latest Logos Network Update',
        imageSrc: 'https://cms-press.logos.co/uploads/large-latest.jpg',
        imageAlt: 'Latest Logos Network Update',
        date: '06.04.26',
        author: 'Logos',
        readingTime: 4,
        href: 'https://blog.logos.co/article/latest-logos-network-update',
      },
    ])
  })
})
