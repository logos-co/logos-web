import { afterEach, describe, expect, it } from 'vitest'

import {
  getPublicCorsHeaders,
  isPublicCorsOriginAllowed,
} from '@/lib/public-cors'

const PREVIEW_WEB_ORIGIN =
  'https://logos-co-web-git-felicio-forms-acidinfo.vercel.app'

describe('public-cors', () => {
  afterEach(() => {
    delete process.env.CORS_ALLOWED_ORIGINS
    delete process.env.VERCEL_ENV
    delete process.env.NODE_ENV
  })

  describe('isPublicCorsOriginAllowed', () => {
    it('allows only logos.co on production deployments', () => {
      process.env.VERCEL_ENV = 'production'
      process.env.NODE_ENV = 'production'

      expect(isPublicCorsOriginAllowed('https://logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(false)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(false)
    })

    it('allows localhost and preview URLs outside production', () => {
      process.env.VERCEL_ENV = 'preview'
      process.env.NODE_ENV = 'production'

      expect(isPublicCorsOriginAllowed('https://logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(true)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(true)
    })

    it('allows localhost in local development', () => {
      process.env.NODE_ENV = 'development'

      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(true)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(true)
    })

    it('rejects unrelated origins', () => {
      process.env.VERCEL_ENV = 'preview'

      expect(isPublicCorsOriginAllowed('https://evil.example')).toBe(false)
      expect(isPublicCorsOriginAllowed('https://other-app.vercel.app')).toBe(
        false
      )
    })

    it('allows origins from CORS_ALLOWED_ORIGINS on any deployment', () => {
      process.env.VERCEL_ENV = 'production'
      process.env.CORS_ALLOWED_ORIGINS =
        'http://localhost:3000,https://staging.example'

      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(true)
      expect(isPublicCorsOriginAllowed('https://staging.example')).toBe(true)
    })
  })

  describe('getPublicCorsHeaders', () => {
    it('returns CORS headers for allowed origins', () => {
      process.env.VERCEL_ENV = 'preview'

      expect(getPublicCorsHeaders(PREVIEW_WEB_ORIGIN)).toEqual({
        'Access-Control-Allow-Origin': PREVIEW_WEB_ORIGIN,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
        Vary: 'Origin',
      })
    })

    it('returns no headers for disallowed origins', () => {
      process.env.VERCEL_ENV = 'production'

      expect(getPublicCorsHeaders(PREVIEW_WEB_ORIGIN)).toEqual({})
      expect(getPublicCorsHeaders('https://evil.example')).toEqual({})
      expect(getPublicCorsHeaders(null)).toEqual({})
    })
  })
})
