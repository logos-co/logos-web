import type { RelatedArticlesSection } from '@repo/content/schemas'

import type { BlogArticleRow } from '@/lib/blog-engine'

export interface TechStackRelatedArticleCard {
  title: string
  mobileTitle?: string
  imageSrc: string
  imageAlt: string
  imagePosition?: string
  date: string
  author: string
  readingTime?: number
  href: string
}

export const TECH_STACK_RELATED_ARTICLE_TAGS = {
  blockchain: 'Blockchain',
  messaging: 'Messaging',
  networking: 'Logos_stack',
  storage: 'Storage',
} as const

export function blogArticlesToTechStackRelatedCards(
  articles: ReadonlyArray<BlogArticleRow>
): TechStackRelatedArticleCard[] {
  return articles.map((article) => ({
    title: article.title,
    imageSrc: article.cardImage,
    imageAlt: article.title,
    date: article.galleryDate,
    author: article.author,
    readingTime: article.readingTime,
    href: article.href,
  }))
}

export function getTechStackRelatedArticleCards(
  data: RelatedArticlesSection,
  articles: ReadonlyArray<BlogArticleRow>
): TechStackRelatedArticleCard[] {
  if (articles.length > 0) {
    return blogArticlesToTechStackRelatedCards(articles)
  }

  return (
    data.items?.map((item) => ({
      title: item.title,
      mobileTitle: item.mobileTitle,
      imageSrc: item.image.src,
      imageAlt: item.image.alt,
      imagePosition: item.imagePosition,
      date: item.date,
      author: item.author,
      readingTime: item.readingTime,
      href: item.href,
    })) ?? blogArticlesToTechStackRelatedCards(articles)
  )
}
