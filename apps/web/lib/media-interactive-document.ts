import { prepareCmsLinks } from './html-links'

const EMBED_CSP = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: https:; media-src https:; style-src 'unsafe-inline' https://fonts.googleapis.com; font-src https://fonts.gstatic.com; script-src 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com https://unpkg.com; connect-src https:; frame-src https:;">`

export function injectEmbedCsp(html: string): string {
  if (/<meta[^>]+http-equiv=["']Content-Security-Policy["']/i.test(html)) {
    return html
  }
  if (/<head[^>]*>/i.test(html)) {
    return html.replace(/<head[^>]*>/i, (match) => `${match}${EMBED_CSP}`)
  }
  return `<!doctype html><html><head><meta charset="utf-8" />${EMBED_CSP}</head><body>${html}</body></html>`
}

export function buildInteractiveDocument(fullHtml: string): string {
  return injectEmbedCsp(prepareCmsLinks(fullHtml))
}
