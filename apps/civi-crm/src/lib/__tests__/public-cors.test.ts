import { afterEach, describe, expect, it } from 'vitest'

import {
  getPublicCorsHeaders,
  isPublicCorsOriginAllowed,
} from '@/lib/public-cors'

const PREVIEW_WEB_ORIGIN =
  'https://logos-co-web-git-felicio-forms-acidinfo.vercel.app'

function setEnvVar(name: string, value: string | undefined): void {
  process.env[name] = value
}

describe('public-cors', () => {
  afterEach(() => {
    setEnvVar('CORS_ALLOWED_ORIGINS', undefined)
    setEnvVar('VERCEL_ENV', undefined)
    setEnvVar('NODE_ENV', undefined)
  })

  describe('isPublicCorsOriginAllowed', () => {
    it('allows only logos.co on production deployments', () => {
      setEnvVar('VERCEL_ENV', 'production')
      setEnvVar('NODE_ENV', 'production')

      expect(isPublicCorsOriginAllowed('https://logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('http://localhost:3010')).toBe(false)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(false)
    })

    it('allows localhost and preview URLs outside production', () => {
      setEnvVar('VERCEL_ENV', 'preview')
      setEnvVar('NODE_ENV', 'production')

      expect(isPublicCorsOriginAllowed('https://logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('http://localhost:3010')).toBe(true)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(true)
    })

    it('allows localhost in local development', () => {
      setEnvVar('NODE_ENV', 'development')

      expect(isPublicCorsOriginAllowed('http://localhost:3010')).toBe(true)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(true)
    })

    it('rejects unrelated origins', () => {
      setEnvVar('VERCEL_ENV', 'preview')

      expect(isPublicCorsOriginAllowed('https://evil.example')).toBe(false)
      expect(isPublicCorsOriginAllowed('https://other-app.vercel.app')).toBe(
        false
      )
    })

    it('allows origins from CORS_ALLOWED_ORIGINS on any deployment', () => {
      setEnvVar('VERCEL_ENV', 'production')
      setEnvVar(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3010,https://staging.example'
      )

      expect(isPublicCorsOriginAllowed('http://localhost:3010')).toBe(true)
      expect(isPublicCorsOriginAllowed('https://staging.example')).toBe(true)
    })
  })

  describe('getPublicCorsHeaders', () => {
    it('returns CORS headers for allowed origins', () => {
      setEnvVar('VERCEL_ENV', 'preview')

      expect(getPublicCorsHeaders(PREVIEW_WEB_ORIGIN)).toEqual({
        'Access-Control-Allow-Origin': PREVIEW_WEB_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      })
    })

    it('returns no headers for disallowed origins', () => {
      setEnvVar('VERCEL_ENV', 'production')

      expect(getPublicCorsHeaders(PREVIEW_WEB_ORIGIN)).toEqual({})
      expect(getPublicCorsHeaders('https://evil.example')).toEqual({})
      expect(getPublicCorsHeaders(null)).toEqual({})
    })
  })
})
