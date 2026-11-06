import { prepareCmsLinks } from './html-links'
import {
  DEFAULT_HOST_STORAGE,
  type FrameSize,
  type HostStorage,
  interactiveFrameScript,
} from './media-interactive-frame'

const EMBED_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; media-src https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; connect-src https:; frame-src https:;">`

/** `<head>` with or without attributes, but not `<header>`. */
const HEAD_TAG = /<head(?=[\s>])[^>]*>/i
const HTML_TAG = /<html(?=[\s>])[^>]*>/i
const DOCTYPE = /^\s*<!doctype[^>]*>/i

export function injectEmbedCsp(html: string): string {
  if (/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    return html
  }
  if (HEAD_TAG.test(html)) {
    return html.replace(HEAD_TAG, (match) => `${match}${EMBED_CSP}`)
  }
  return `<!doctype html><html><head><meta charset="utf-8" />${EMBED_CSP}</head><body>${html}</body></html>`
}

/** Puts the frame integration ahead of any authored markup. */
function injectFrameScript(
  html: string,
  storage: HostStorage,
  size: FrameSize | undefined
): string {
  const script = interactiveFrameScript(storage, size)
  for (const tag of [HEAD_TAG, HTML_TAG, DOCTYPE]) {
    if (tag.test(html)) {
      return html.replace(tag, (match) => `${match}${script}`)
    }
  }
  return `${script}${html}`
}

/**
 * `storage` is what logos.co allows and `size` the measured iframe box, both
 * mirrored inside the frame so the article sees what it would on the site.
 */
export function buildInteractiveDocument(
  fullHtml: string,
  storage: HostStorage = DEFAULT_HOST_STORAGE,
  size?: FrameSize
): string {
  return injectFrameScript(
    injectEmbedCsp(prepareCmsLinks(fullHtml)),
    storage,
    size
  )
}
