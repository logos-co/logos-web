import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

const handleI18nRouting = createMiddleware(routing)

export default function proxy(request: import('next/server').NextRequest) {
  return handleI18nRouting(request)
}

export const config = {
  // /past-present-future belongs to apps/past-present-future (proxied in dev by
  // next.config.mjs), so keep locale routing off it.
  matcher: '/((?!api|_next|_vercel|past-present-future(?:/|$)|.*\\..*).*)',
}
