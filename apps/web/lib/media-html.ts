import { rehype } from 'rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

import type {
  BlogArticleDetail,
  BlogContentBlock,
  BlogPodcastDetail,
  BlogPostMeta,
} from './blog-content'
import { prepareCmsLinks } from './html-links'

const anchorId: [string, RegExp] = ['id', /^[-\w]+$/]
const widthStyle: [string, RegExp] = ['style', /^width:\s*\d+(?:\.\d+)?%;?$/]

const mediaHtml = rehype()
  .data('settings', { fragment: true })
  .use(rehypeSanitize, {
    ...defaultSchema,
    tagNames: [
      ...(defaultSchema.tagNames ?? []).filter((tag) => tag !== 'input'),
      'col',
      'colgroup',
      'figure',
      'figcaption',
      'iframe',
      'u',
    ],
    // Heading and span IDs are the targets of published links and footnotes.
    // Named elements and IDs on other elements are excluded by the allowlist.
    clobber: [],
    attributes: {
      '*': ['dir', 'lang', 'title'],
      a: [
        'href',
        ['target', '_blank', '_self'],
        ['rel', 'noopener', 'noreferrer', 'nofollow', 'ugc', 'sponsored'],
        ['className', 'footnote'],
      ],
      blockquote: ['cite', ['className', 'twitter-tweet']],
      code: [['className', /^language-[\w-]+$/]],
      col: [widthStyle, 'span'],
      colgroup: ['span'],
      details: ['open'],
      div: [
        [
          'className',
          'media-detail-table',
          'media-detail-video-frame',
          'media-detail-video-aspect',
        ],
      ],
      figure: [['className', 'image', 'media', 'table'], widthStyle],
      h1: [anchorId],
      h2: [anchorId],
      h3: [anchorId],
      h4: [anchorId],
      h5: [anchorId],
      h6: [anchorId],
      iframe: [
        [
          'src',
          /^https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/[\w-]{11}$/,
        ],
        ['className', 'media-detail-video'],
        [
          'allow',
          'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
        ],
        'allowFullScreen',
        'height',
        'width',
      ],
      img: [
        'src',
        'srcSet',
        'sizes',
        'alt',
        'width',
        'height',
        ['style', /^aspect-ratio:\s*\d+\s*\/\s*\d+;?$/],
      ],
      ol: ['start', 'reversed', 'type'],
      source: ['srcSet', 'sizes', 'media', 'type'],
      span: [anchorId, ['className', 'anchor']],
      sup: [['className', 'footnote']],
      table: [['className', 'ck-table-resized']],
      td: ['colSpan', 'rowSpan', 'headers'],
      th: ['colSpan', 'rowSpan', 'headers', 'scope'],
    },
    protocols: {
      cite: ['http', 'https'],
      href: ['http', 'https', 'mailto', 'tel'],
      src: ['http', 'https'],
    },
    strip: [
      'embed',
      'form',
      'math',
      'object',
      'script',
      'style',
      'svg',
      'template',
    ],
  })
  .freeze()

function sanitiseHtml(html: string): string
function sanitiseHtml(html: string | undefined): string | undefined
function sanitiseHtml(html: string | undefined): string | undefined {
  return html ? String(mediaHtml.processSync(prepareCmsLinks(html))) : html
}

function sanitiseMeta<T extends BlogPostMeta>(post: T): T {
  return { ...post, summaryHtml: sanitiseHtml(post.summaryHtml) }
}

function sanitiseContentBlock(block: BlogContentBlock): BlogContentBlock {
  if (block.type !== 'text') return block

  return {
    ...block,
    html: sanitiseHtml(block.html),
    embed: block.embed && {
      ...block.embed,
      html: sanitiseHtml(block.embed.html),
    },
  }
}

function sanitiseDetail<T extends BlogArticleDetail | BlogPodcastDetail>(
  post: T
): T {
  return {
    ...sanitiseMeta(post),
    bodyHtml: sanitiseHtml(post.bodyHtml),
    footnotes: post.footnotes?.map((footnote) => ({
      ...footnote,
      valueHTML: sanitiseHtml(footnote.valueHTML),
    })),
    content: post.content?.map(sanitiseContentBlock),
    blocks: post.blocks?.map((block) =>
      block.type === 'rich-text'
        ? { ...block, body: sanitiseHtml(block.body) }
        : block
    ),
  }
}

export function sanitiseMediaArticle(
  article: BlogArticleDetail
): BlogArticleDetail {
  return {
    ...sanitiseDetail(article),
    relatedArticles: article.relatedArticles?.map(sanitiseMeta),
    articlesFromSameAuthors: article.articlesFromSameAuthors?.map(sanitiseMeta),
  }
}

export function sanitiseMediaPodcast(
  podcast: BlogPodcastDetail
): BlogPodcastDetail {
  return {
    ...sanitiseDetail(podcast),
    creditsHtml: sanitiseHtml(podcast.creditsHtml),
    credits: podcast.credits?.map(sanitiseContentBlock),
    relatedEpisodes: podcast.relatedEpisodes?.map(sanitiseMediaPodcast),
  }
}
