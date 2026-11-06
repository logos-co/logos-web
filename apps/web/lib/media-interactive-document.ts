import { prepareCmsLinks } from './html-links'
import { INTERACTIVE_FRAME_SCRIPT } from './media-interactive-frame'

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
function injectFrameScript(html: string): string {
  for (const tag of [HEAD_TAG, HTML_TAG, DOCTYPE]) {
    if (tag.test(html)) {
      return html.replace(tag, (match) => `${match}${INTERACTIVE_FRAME_SCRIPT}`)
    }
  }
  return `${INTERACTIVE_FRAME_SCRIPT}${html}`
}

export function buildInteractiveDocument(fullHtml: string): string {
  return injectFrameScript(injectEmbedCsp(prepareCmsLinks(fullHtml)))
}
