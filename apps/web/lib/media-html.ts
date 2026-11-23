import { rehype } from 'rehype'
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize'

import type {
  BlogArticleDetail,
  BlogContentBlock,
  BlogPodcastDetail,
  BlogPostMeta,
} from './blog-content'
import { prepareCmsLinks } from './html-links'
import { defaultMediaAnchorPrefix } from './media-anchors'
import { mediaAnchorScope, type MediaHtmlTree } from './media-html-anchors'

const anchorId: [string, RegExp] = ['id', /^\S+$/u]
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
    clobberPrefix: defaultMediaAnchorPrefix,
    attributes: {
      '*': [anchorId, 'dir', 'lang', 'title'],
      a: [
        'href',
        ['name', /^\S+$/u],
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
      iframe: [
        'src',
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
      span: [['className', 'anchor']],
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

type HtmlTransform = (html: string | undefined) => string | undefined
type MediaPost = BlogArticleDetail | BlogPodcastDetail

function mapSummary<T extends BlogPostMeta>(post: T, transform: HtmlTransform) {
  return { ...post, summaryHtml: transform(post.summaryHtml) }
}

function mapContent(
  block: BlogContentBlock,
  transform: HtmlTransform
): BlogContentBlock {
  if (block.type !== 'text') return block

  return {
    ...block,
    html: transform(block.html) ?? '',
    embed: block.embed && {
      ...block.embed,
      html: transform(block.embed.html) ?? '',
    },
  }
}

function mapDetail<T extends MediaPost>(post: T, transform: HtmlTransform): T {
  return {
    ...mapSummary(post, transform),
    bodyHtml: transform(post.bodyHtml),
    footnotes: post.footnotes?.map((footnote) => ({
      ...footnote,
      valueHTML: transform(footnote.valueHTML) ?? '',
    })),
    content: post.content?.map((block) => mapContent(block, transform)),
    blocks: post.blocks?.map((block) =>
      block.type === 'rich-text'
        ? { ...block, body: transform(block.body) ?? '' }
        : block
    ),
  }
}

function mapArticle(
  article: BlogArticleDetail,
  transform: HtmlTransform
): BlogArticleDetail {
  return {
    ...mapDetail(article, transform),
    relatedArticles: article.relatedArticles?.map((item) =>
      mapSummary(item, transform)
    ),
    articlesFromSameAuthors: article.articlesFromSameAuthors?.map((item) =>
      mapSummary(item, transform)
    ),
  }
}

function mapPodcast(
  podcast: BlogPodcastDetail,
  transform: HtmlTransform
): BlogPodcastDetail {
  return {
    ...mapDetail(podcast, transform),
    creditsHtml: transform(podcast.creditsHtml),
    credits: podcast.credits?.map((block) => mapContent(block, transform)),
  }
}

function sanitisePost<T extends MediaPost>(
  post: T,
  mapHtml: (post: T, transform: HtmlTransform) => T
) {
  const anchors = mediaAnchorScope(post.mediaAnchorPrefix)
  const prepared = new Map<string, MediaHtmlTree>()
  post.footnotes?.forEach((note) => {
    if (note.id) anchors.targets.add(`fnt-${note.id}`)
  })

  // IDs in other fragments, such as credits and footnotes, are valid link targets.
  mapHtml(post, (html) => {
    if (html && !prepared.has(html)) {
      const tree = mediaHtml.runSync(mediaHtml.parse(prepareCmsLinks(html)))
      tree.children.forEach(anchors.collect)
      prepared.set(html, tree)
    }
    return html
  })

  const prefix = anchors.prefix()
  const sanitised = mapHtml(post, (html) => {
    const tree = html && prepared.get(html)
    return tree ? mediaHtml.stringify(anchors.rewriteTree(tree, prefix)) : html
  })
  return {
    sanitised: {
      ...sanitised,
      mediaAnchorPrefix: anchors.targets.size > 0 ? prefix : undefined,
    },
    rewriteHref: (href: string) => anchors.rewriteHref(href),
  }
}

export function sanitiseMediaArticle(
  article: BlogArticleDetail
): BlogArticleDetail {
  const { sanitised, rewriteHref } = sanitisePost(article, mapArticle)
  return {
    ...sanitised,
    toc: article.toc?.map((item) =>
      item.level === 0 ? item : { ...item, href: rewriteHref(item.href) }
    ),
  }
}

export function sanitiseMediaPodcast(
  podcast: BlogPodcastDetail
): BlogPodcastDetail {
  const { sanitised } = sanitisePost(podcast, mapPodcast)
  return {
    ...sanitised,
    relatedEpisodes: podcast.relatedEpisodes?.map(sanitiseMediaPodcast),
  }
}
