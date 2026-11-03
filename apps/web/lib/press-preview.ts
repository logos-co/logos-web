import { env } from './env'
import slugs from './press-preview-articles.json'

/** Only these explicitly approved articles may expose drafts on public staging. */
export function getPressPreviewSlugs(): string[] {
  return env.NEXT_PUBLIC_API_MODE === 'staging' ? slugs : []
}

export function isPressPreviewArticle(post: {
  slug: string
  publishedAt: string | null
}): boolean {
  return Boolean(post.publishedAt) && getPressPreviewSlugs().includes(post.slug)
}
