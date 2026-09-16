import { type NextRequest, NextResponse } from 'next/server'

import { getPublicCorsHeaders } from '@/lib/public-cors'

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin')
  const corsHeaders = getPublicCorsHeaders(origin)

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers: corsHeaders })
  }

  const response = NextResponse.next()
  for (const [key, value] of Object.entries(corsHeaders)) {
    response.headers.set(key, value)
  }
  return response
}

export const config = {
  matcher: '/api/public/:path*',
}
