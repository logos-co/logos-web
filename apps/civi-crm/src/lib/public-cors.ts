const PRODUCTION_ORIGIN_PATTERNS: RegExp[] = [/^https:\/\/logos\.co$/]

const LOCAL_DEV_ORIGIN_PATTERNS: RegExp[] = [/^http:\/\/localhost:\d+$/]

const PREVIEW_WEB_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/logos-co-web[-a-z0-9.]*\.vercel\.app$/,
]

function extraAllowedOrigins(): string[] {
  const raw = process.env.CORS_ALLOWED_ORIGINS ?? ''
  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
}

/** True on Vercel production; also when running a local production build (`next start`). */
function isProductionDeployment(): boolean {
  if (process.env.VERCEL_ENV) {
    return process.env.VERCEL_ENV === 'production'
  }
  return process.env.NODE_ENV === 'production'
}

function builtInOriginPatterns(): RegExp[] {
  if (isProductionDeployment()) {
    return PRODUCTION_ORIGIN_PATTERNS
  }

  return [
    ...PRODUCTION_ORIGIN_PATTERNS,
    ...LOCAL_DEV_ORIGIN_PATTERNS,
    ...PREVIEW_WEB_ORIGIN_PATTERNS,
  ]
}

export function isPublicCorsOriginAllowed(origin: string): boolean {
  if (extraAllowedOrigins().includes(origin)) {
    return true
  }
  return builtInOriginPatterns().some((pattern) => pattern.test(origin))
}

export function getPublicCorsHeaders(origin: string | null): HeadersInit {
  if (!origin || !isPublicCorsOriginAllowed(origin)) {
    return {}
  }

  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  }
}
