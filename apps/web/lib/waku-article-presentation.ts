import { stripBlogHtml } from './blog-content'
import type { BlogArticleDetail } from './blog-content'
import migratedSlugs from './press-preview-articles.json'

export function wakuArticleHeroVisibility(
  article: Pick<
    BlogArticleDetail,
    'slug' | 'bodyHtml' | 'summary' | 'coverImage'
  >
): { showCover: boolean; showSummary: boolean } {
  const body = article.bodyHtml ?? ''
  if (!migratedSlugs.includes(article.slug) || !body)
    return { showCover: true, showSummary: true }

  const sources = [...body.matchAll(/<img\b[^>]*\bsrc=["']([^"']+)["']/gi)]
  const paragraphs = [...body.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
  const normalise = (value: string) =>
    stripBlogHtml(value.replace(/<[^>]*>/g, ''))
      .replace(/\s+/g, ' ')
      .trim()
  return {
    showCover: !sources.some((match) => match[1] === article.coverImage?.url),
    showSummary: !paragraphs.some(
      (match) => normalise(match[1]) === normalise(article.summary)
    ),
  }
}
