import document from './index.html?raw'

const previewHost = process.env.VERCEL_BRANCH_URL || process.env.VERCEL_URL
const shareOrigin =
  process.env.VERCEL_ENV === 'preview' && previewHost
    ? `https://${previewHost}`
    : 'https://logos.co'

export const prerender = true
export const trailingSlash = 'ignore'

export function GET() {
  return new Response(document.replaceAll('__SHARE_ORIGIN__', shareOrigin), {
    headers: { 'content-type': 'text/html' },
  })
}
