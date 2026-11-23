import document from './index.html?raw'

export const prerender = true
export const trailingSlash = 'ignore'

export function GET() {
  return new Response(document, {
    headers: { 'content-type': 'text/html' },
  })
}
