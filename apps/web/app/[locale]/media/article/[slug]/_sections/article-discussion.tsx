import { EXTERNAL_URLS } from '@/constants/routes'
import type { BlogArticleDetail } from '@/lib/blog-content'

import type { ArticleDetailCopy } from './types'

interface ArticleDiscussionProps {
  article: BlogArticleDetail
  canonicalUrl: string
  copy: Pick<
    ArticleDetailCopy,
    | 'discussion'
    | 'discussionComments'
    | 'joinDiscussion'
    | 'noDiscussion'
    | 'readFullArticle'
    | 'startDiscussion'
    | 'viewFullDiscussion'
  >
}

function newDiscussionUrl(
  article: BlogArticleDetail,
  canonicalUrl: string,
  readFullArticle: string
): string {
  const url = new URL('new-topic', EXTERNAL_URLS.forum)
  url.searchParams.set('title', article.title)
  url.searchParams.set(
    'body',
    `${article.summary}\n\n[${readFullArticle}](${canonicalUrl})`
  )
  url.searchParams.set('category', '8')
  return url.toString()
}

export function ArticleDiscussion({
  article,
  canonicalUrl,
  copy,
}: ArticleDiscussionProps) {
  const discussion = article.discussion
  const actionUrl =
    discussion?.url ??
    newDiscussionUrl(article, canonicalUrl, copy.readFullArticle)

  return (
    <section className="my-8">
      <div className="mb-4 flex items-center justify-between gap-4">
        <h2 className="font-sans text-[20px] font-semibold leading-[30px]">
          {copy.discussion}
        </h2>
        <a
          href={actionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="cursor-pointer font-sans text-[14px] leading-5 underline underline-offset-2"
        >
          {discussion ? copy.joinDiscussion : copy.startDiscussion}
        </a>
      </div>

      {discussion ? (
        <div className="flex flex-col gap-4">
          <div>
            <h3 className="font-sans text-[16px] font-semibold leading-6">
              {discussion.title}
            </h3>
            <div className="mt-1 flex items-center gap-2 font-sans text-[12px] leading-4">
              <span>{copy.discussionComments}</span>
              <span aria-hidden="true">•</span>
              <a
                href={discussion.url}
                target="_blank"
                rel="noopener noreferrer"
                className="cursor-pointer underline underline-offset-2"
              >
                {copy.viewFullDiscussion}
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
                        {new Intl.DateTimeFormat('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        }).format(new Date(post.createdAt))}
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
            <p className="py-4 text-center font-sans text-[14px] italic leading-5">
              {copy.noDiscussion}
            </p>
          )}
        </div>
      ) : (
        <p className="py-4 text-center font-sans text-[14px] italic leading-5">
          {copy.noDiscussion}
        </p>
      )}
    </section>
  )
}
