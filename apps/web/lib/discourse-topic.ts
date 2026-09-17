import { EXTERNAL_URLS } from '@/constants/routes'
import { addTargetBlank } from '@/lib/html-links'

/**
 * Reads the public Discourse topic behind a /media article. Shared by the
 * static build, which bakes a snapshot into the page, and the browser, which
 * swaps in the live replies after hydration. forum.logos.co answers CORS for
 * logos.co and its preview deployments.
 */

const FORUM_ORIGIN = EXTERNAL_URLS.forum.replace(/\/$/, '')
/** The article page previews the first few replies, like the legacy blog. */
const PREVIEW_REPLY_COUNT = 3
const AVATAR_SIZE = '40'

export interface BlogDiscussionPost {
  id: string
  avatarUrl: string
  createdAt: string
  displayName: string
  html: string
}

export interface BlogDiscussion {
  id: number
  posts: BlogDiscussionPost[]
  postsCount: number
  slug: string
  title: string
  url: string
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const stringValue = (value: unknown): string =>
  typeof value === 'string' ? value : ''

export const discourseTopicJsonUrl = (topicId: number): string =>
  `${FORUM_ORIGIN}/t/${topicId}.json`

function parseReply(post: Record<string, unknown>): BlogDiscussionPost | null {
  const id = post.id
  const username = stringValue(post.username)
  const avatarTemplate = stringValue(post.avatar_template)
  const createdAt = stringValue(post.created_at)
  const html = stringValue(post.cooked)
  if (!id || !username || !avatarTemplate || !createdAt || !html) return null

  const avatarPath = avatarTemplate.replace('{size}', AVATAR_SIZE)
  return {
    id: String(id),
    avatarUrl: avatarPath.startsWith('http')
      ? avatarPath
      : `${FORUM_ORIGIN}${avatarPath}`,
    createdAt,
    displayName: stringValue(post.display_username) || username,
    html: addTargetBlank(
      html.replace(/href="\/u\//g, `href="${FORUM_ORIGIN}/u/`)
    ),
  }
}

export function parseDiscourseTopic(
  topicId: number,
  topic: unknown
): BlogDiscussion | undefined {
  if (!isRecord(topic)) return undefined

  const slug = stringValue(topic.slug)
  const stream = isRecord(topic.post_stream) ? topic.post_stream : {}
  const rawPosts = Array.isArray(stream.posts) ? stream.posts : []
  // The first post is the topic itself, not a reply.
  const posts = rawPosts
    .slice(1, PREVIEW_REPLY_COUNT + 1)
    .filter(isRecord)
    .map(parseReply)
    .filter((post): post is BlogDiscussionPost => post !== null)
  const rawPostsCount =
    typeof topic.posts_count === 'number' && Number.isFinite(topic.posts_count)
      ? topic.posts_count
      : 1

  return {
    id: topicId,
    posts,
    postsCount: Math.max(0, rawPostsCount - 1),
    slug,
    title: stringValue(topic.title),
    url: `${FORUM_ORIGIN}/t/${slug}/${topicId}`,
  }
}

/**
 * Resolves to undefined when the forum has no such topic. Network and parse
 * failures reject so each caller can choose its own fallback.
 */
export async function fetchDiscourseTopic(
  topicId: number,
  init?: RequestInit
): Promise<BlogDiscussion | undefined> {
  const response = await fetch(discourseTopicJsonUrl(topicId), init)
  if (!response.ok) return undefined

  return parseDiscourseTopic(topicId, await response.json())
}
