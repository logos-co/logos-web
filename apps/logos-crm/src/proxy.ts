import { type NextRequest, NextResponse } from 'next/server'

import { isAuthorised } from '@/lib/access'

export function proxy(request: NextRequest): NextResponse {
  const authorised = isAuthorised({
    authorization: request.headers.get('authorization'),
    token: process.env.CRM_AUTH_TOKEN,
    nodeEnv: process.env.NODE_ENV,
  })
  if (authorised) return NextResponse.next()
  return new NextResponse('Authentication required.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="Logos CRM", charset="UTF-8"' },
  })
}

export const config = {
  matcher: '/((?!api/health$).*)',
}
