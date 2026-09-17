'use client'

import { useTranslations } from 'next-intl'
import { useEffect, useState } from 'react'

import { EXTERNAL_URLS } from '@/constants/routes'
import { fetchDiscourseTopic, type BlogDiscussion } from '@/lib/discourse-topic'
import { logger } from '@/lib/logger'

/** Forum category the legacy blog filed article discussions under. */
const ARTICLE_DISCUSSION_CATEGORY_ID = '8'

interface ArticleDiscussionProps {
  canonicalUrl: string
  /** Replies baked in at build time; shown until the live fetch lands. */
  initialDiscussion?: BlogDiscussion
  summary: string
  title: string
  topicId?: number
}

function formatPostDate(value: string): string {
  // Fixed zone so the server snapshot and the hydrated page agree.
  return new Intl.DateTimeFormat('en-GB', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function newDiscussionUrl(
  title: string,
  summary: string,
  canonicalUrl: string,
  readFullArticle: string
): string {
  const url = new URL('new-topic', EXTERNAL_URLS.forum)
  url.searchParams.set('title', title)
  url.searchParams.set(
    'body',
    `${summary}\n\n[${readFullArticle}](${canonicalUrl})`
  )
  url.searchParams.set('category', ARTICLE_DISCUSSION_CATEGORY_ID)
  return url.toString()
}

/**
 * forum.logos.co only answers CORS for logos.co and its preview deployments,
 * so a localhost request always fails with a console error.
 */
const CAN_REFRESH_DISCUSSION = process.env.NODE_ENV === 'production'

/**
 * The static export freezes replies at build time, so refresh them from the
 * forum once the page is in the browser. Any failure keeps the snapshot.
 */
function useLiveDiscussion(
  topicId: number | undefined,
  initialDiscussion: BlogDiscussion | undefined
): BlogDiscussion | undefined {
  const [discussion, setDiscussion] = useState(initialDiscussion)

  useEffect(() => {
    if (!topicId || !CAN_REFRESH_DISCUSSION) return

    const controller = new AbortController()
    fetchDiscourseTopic(topicId, { signal: controller.signal })
      .then((latest) => {
        if (latest) setDiscussion(latest)
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return
        logger.debug('Live discussion refresh failed', { topicId, error })
      })

    return () => controller.abort()
  }, [topicId])

  return discussion
}

export function ArticleDiscussion({
  canonicalUrl,
  initialDiscussion,
  summary,
  title,
  topicId,
}: ArticleDiscussionProps) {
  const t = useTranslations('mediaDetail.article')
  const discussion = useLiveDiscussion(topicId, initialDiscussion)
  const actionUrl =
    discussion?.url ??
    newDiscussionUrl(title, summary, canonicalUrl, t('readFullArticle'))

  return (
    <section className="mb-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="font-sans text-[20px] font-semibold leading-[42px]">
          {t('discussion')}
        </h3>
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer font-sans text-[14px] leading-5 underline underline-offset-2"
        >
          {discussion ? t('joinDiscussion') : t('startDiscussion')}
        </a>
      </div>

      {discussion ? (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-sans text-[16px] font-semibold leading-6">
              {discussion.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 font-sans text-[12px] leading-4">
              <span>{t('comments', { count: discussion.postsCount })}</span>
              <span aria-hidden="true">•</span>
              <a
                href={discussion.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer underline underline-offset-2"
              >
                {t('viewFullDiscussion')}
              </a>
            </div>
          </div>

          {discussion.posts.length > 0 ? (
            <div className="flex flex-col gap-4">
              {discussion.posts.map((post) => (
                <article
                  key={post.id}
                  className="border-t border-brand-dark-green/30 pt-4"
                >
                  <div className="mb-3 flex items-center gap-3">
                    {/* Discourse avatar URLs are remote and have variable dimensions. */}
                    <img
                      src={post.avatarUrl}
                      alt={post.displayName}
                      width={40}
                      height={40}
                      className="size-10 rounded-full object-cover"
                    />
                    <div>
                      <p className="font-sans text-[14px] font-semibold leading-5">
                        {post.displayName}
                      </p>
                      <time
                        dateTime={post.createdAt}
                        className="font-sans text-[12px] leading-4"
                      >
                        {formatPostDate(post.createdAt)}
                      </time>
                    </div>
                  </div>
                  <div
                    className="media-discussion-post font-sans text-[14px] leading-5"
                    dangerouslySetInnerHTML={{ __html: post.html }}
                  />
                </article>
              ))}
            </div>
          ) : (
            <p className="py-4 text-center font-sans text-[14px] italic leading-6">
              {t('noDiscussion')}
            </p>
          )}
        </div>
      ) : (
        <p className="py-4 text-center font-sans text-[14px] italic leading-6">
          {t('noDiscussion')}
        </p>
      )}
    </section>
  )
}
