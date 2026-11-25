import { afterEach, describe, expect, it } from 'vitest'

import {
  getPublicCorsHeaders,
  isPublicCorsOriginAllowed,
  isPublicSiteHostnameAllowed,
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

  describe('isPublicSiteHostnameAllowed', () => {
    it('accepts the hostnames of the allowed origins only', () => {
      setEnvVar('VERCEL_ENV', 'production')
      setEnvVar('CORS_ALLOWED_ORIGINS', 'https://staging.example.org')

      expect(isPublicSiteHostnameAllowed('logos.co')).toBe(true)
      expect(isPublicSiteHostnameAllowed('dev.logos.co')).toBe(true)
      expect(isPublicSiteHostnameAllowed('staging.example.org')).toBe(true)
      expect(isPublicSiteHostnameAllowed('localhost')).toBe(false)
      expect(isPublicSiteHostnameAllowed('evil.example')).toBe(false)
      expect(isPublicSiteHostnameAllowed('logos.co/x')).toBe(false)
    })

    it('adds localhost and the web previews outside production', () => {
      setEnvVar('VERCEL_ENV', 'preview')

      expect(isPublicSiteHostnameAllowed('localhost')).toBe(true)
      expect(
        isPublicSiteHostnameAllowed(new URL(PREVIEW_WEB_ORIGIN).hostname)
      ).toBe(true)
    })
  })

  describe('isPublicCorsOriginAllowed', () => {
    it('allows only the logos.co sites on production deployments', () => {
      setEnvVar('VERCEL_ENV', 'production')
      setEnvVar('NODE_ENV', 'production')

      expect(isPublicCorsOriginAllowed('https://logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('https://dev.logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(false)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(false)
    })

    it('allows localhost and preview URLs outside production', () => {
      setEnvVar('VERCEL_ENV', 'preview')
      setEnvVar('NODE_ENV', 'production')

      expect(isPublicCorsOriginAllowed('https://logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('https://dev.logos.co')).toBe(true)
      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(true)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(true)
    })

    it('allows localhost in local development', () => {
      setEnvVar('NODE_ENV', 'development')

      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(true)
      expect(isPublicCorsOriginAllowed(PREVIEW_WEB_ORIGIN)).toBe(true)
    })

    it('rejects unrelated origins', () => {
      setEnvVar('VERCEL_ENV', 'preview')

      expect(isPublicCorsOriginAllowed('https://evil.example')).toBe(false)
      expect(isPublicCorsOriginAllowed('https://other-app.vercel.app')).toBe(
        false
      )
      expect(isPublicCorsOriginAllowed('https://logos.co.evil.example')).toBe(
        false
      )
      expect(isPublicCorsOriginAllowed('http://dev.logos.co')).toBe(false)
    })

    it('allows origins from CORS_ALLOWED_ORIGINS on any deployment', () => {
      setEnvVar('VERCEL_ENV', 'production')
      setEnvVar(
        'CORS_ALLOWED_ORIGINS',
        'http://localhost:3000,https://staging.example'
      )

      expect(isPublicCorsOriginAllowed('http://localhost:3000')).toBe(true)
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
