import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { CiviCRMClient, CiviCRMError } from './client'

const BASE_URL = 'https://crm.example.com'
const API_KEY = 'test-key'

function makeClient() {
  return new CiviCRMClient(BASE_URL, API_KEY)
}

function okResponse<T>(values: T[], count = values.length) {
  return new Response(JSON.stringify({ values, count }), { status: 200 })
}

function errorResponse(status: number, body = 'Bad request') {
  return new Response(body, { status })
}

describe('CiviCRMClient', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('auth header', () => {
    it('sends X-Civi-Auth on every request', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([]))
      await makeClient().get('Case', {})
      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Civi-Auth': `Bearer ${API_KEY}`,
          }),
        })
      )
    })
  })

  describe('get', () => {
    it('POSTs to the correct URL and returns values', async () => {
      const values = [{ id: 1, subject: 'Test' }]
      vi.mocked(fetch).mockResolvedValue(okResponse(values))

      const result = await makeClient().get('Case', {
        select: ['id', 'subject'],
        limit: 10,
      })

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/civicrm/ajax/api4/Case/get`,
        expect.objectContaining({ method: 'POST' })
      )
      expect(result).toEqual(values)
    })

    it('throws CiviCRMError on non-2xx', async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(errorResponse(403, 'Forbidden'))
      )
      const err = await makeClient()
        .get('Case', {})
        .catch((e: unknown) => e)
      if (!(err instanceof CiviCRMError)) {
        throw new Error('Expected CiviCRMError')
      }
      expect(err.status).toBe(403)
    })
  })

  describe('create', () => {
    it('POSTs to the correct URL with serialized values and returns the first value', async () => {
      const record = { id: 42, subject: 'New' }
      vi.mocked(fetch).mockResolvedValue(okResponse([record]))

      const result = await makeClient().create('Case', { subject: 'New' })

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/civicrm/ajax/api4/Case/create`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ values: { subject: 'New' } }),
        })
      )
      expect(result).toEqual(record)
    })

    it('throws CiviCRMError when response values is empty', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([]))
      const err = await makeClient()
        .create('Case', {})
        .catch((e: unknown) => e)
      if (!(err instanceof CiviCRMError)) {
        throw new Error('Expected CiviCRMError')
      }
      expect(err.status).toBe(200)
    })

    it('throws CiviCRMError on non-2xx', async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(errorResponse(500, 'Server error'))
      )
      const err = await makeClient()
        .create('Case', {})
        .catch((e: unknown) => e)
      if (!(err instanceof CiviCRMError)) {
        throw new Error('Expected CiviCRMError')
      }
      expect(err.status).toBe(500)
    })
  })

  describe('update', () => {
    it('POSTs to the correct URL with serialized where and values, and returns values', async () => {
      const updated = [{ id: 1, subject: 'Updated' }]
      vi.mocked(fetch).mockResolvedValue(okResponse(updated))

      const where: [string, string, string][] = [['id', '=', '1']]
      const result = await makeClient().update('Case', where, {
        subject: 'Updated',
      })

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/civicrm/ajax/api4/Case/update`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ where, values: { subject: 'Updated' } }),
        })
      )
      expect(result).toEqual(updated)
    })

    it('throws CiviCRMError on non-2xx', async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(errorResponse(404, 'Not found'))
      )
      const err = await makeClient()
        .update('Case', [], {})
        .catch((e: unknown) => e)
      if (!(err instanceof CiviCRMError)) {
        throw new Error('Expected CiviCRMError')
      }
      expect(err.status).toBe(404)
    })
  })

  describe('count', () => {
    it('POSTs to the /get endpoint', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([{ row_count: 0 }]))

      await makeClient().count('Case', {})

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/civicrm/ajax/api4/Case/get`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('sends select: ["row_count"] without a limit', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([{ row_count: 0 }]))
      const where: [string, string, string][] = [
        ['status_id:name', '=', 'open'],
      ]

      await makeClient().count('Case', { where })

      const body = JSON.parse(
        (vi.mocked(fetch).mock.calls[0][1]!.body as string) ?? '{}'
      )
      expect(body.select).toEqual(['row_count'])
      expect(body.limit).toBeUndefined()
      expect(body.where).toEqual(where)
    })

    it('returns row_count from the first value', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([{ row_count: 99 }]))

      const result = await makeClient().count('Case', {})
      expect(result).toBe(99)
    })

    it('returns 0 when values is empty', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([]))

      const result = await makeClient().count('Case', {})
      expect(result).toBe(0)
    })

    it('throws CiviCRMError on non-2xx', async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(errorResponse(403, 'Forbidden'))
      )
      const err = await makeClient()
        .count('Case', {})
        .catch((e: unknown) => e)
      if (!(err instanceof CiviCRMError)) {
        throw new Error('Expected CiviCRMError')
      }
      expect(err.status).toBe(403)
    })
  })

  describe('delete', () => {
    it('POSTs to the correct URL', async () => {
      vi.mocked(fetch).mockResolvedValue(okResponse([]))

      await makeClient().delete('Case', [['id', '=', '1']])

      expect(vi.mocked(fetch)).toHaveBeenCalledWith(
        `${BASE_URL}/civicrm/ajax/api4/Case/delete`,
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('throws CiviCRMError on non-2xx', async () => {
      vi.mocked(fetch).mockImplementation(() =>
        Promise.resolve(errorResponse(401, 'Unauthorized'))
      )
      const err = await makeClient()
        .delete('Case', [])
        .catch((e: unknown) => e)
      if (!(err instanceof CiviCRMError)) {
        throw new Error('Expected CiviCRMError')
      }
      expect(err.status).toBe(401)
    })
  })

  describe('debug logging', () => {
    let debugSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {})
    })

    afterEach(() => {
      vi.restoreAllMocks()
      vi.unstubAllEnvs()
    })

    it('logs request and response when LOG_LEVEL=DEBUG', async () => {
      vi.stubEnv('LOG_LEVEL', 'DEBUG')
      vi.mocked(fetch).mockResolvedValue(okResponse([{ id: 1 }]))

      await makeClient().get('Case', { select: ['id'] })

      expect(debugSpy).toHaveBeenCalledTimes(2)
      expect(debugSpy.mock.calls[0][0]).toContain('[CiviCRM] → POST')
      expect(debugSpy.mock.calls[0][0]).toContain('/civicrm/ajax/api4/Case/get')
      expect(debugSpy.mock.calls[1][0]).toContain('[CiviCRM] ← 200')
      expect(debugSpy.mock.calls[1][0]).toContain('"id":1')
    })

    it('is case-insensitive -- logs when LOG_LEVEL=debug', async () => {
      vi.stubEnv('LOG_LEVEL', 'debug')
      vi.mocked(fetch).mockResolvedValue(okResponse([]))

      await makeClient().get('Case', {})

      expect(debugSpy).toHaveBeenCalledTimes(2)
    })

    it('does not log when LOG_LEVEL is absent', async () => {
      vi.stubEnv('LOG_LEVEL', '')
      vi.mocked(fetch).mockResolvedValue(okResponse([]))

      await makeClient().get('Case', {})

      expect(debugSpy).not.toHaveBeenCalled()
    })

    it('does not log when LOG_LEVEL=INFO', async () => {
      vi.stubEnv('LOG_LEVEL', 'INFO')
      vi.mocked(fetch).mockResolvedValue(okResponse([]))

      await makeClient().get('Case', {})

      expect(debugSpy).not.toHaveBeenCalled()
    })

    it('includes the request body in the log', async () => {
      vi.stubEnv('LOG_LEVEL', 'DEBUG')
      vi.mocked(fetch).mockResolvedValue(okResponse([]))
      const params = { select: ['id', 'subject'], limit: 5 }

      await makeClient().get('Case', params)

      expect(debugSpy.mock.calls[0][0]).toContain(JSON.stringify(params))
    })

    it('trims logged response body to 1000 characters', async () => {
      vi.stubEnv('LOG_LEVEL', 'DEBUG')
      const values = [{ body: 'x'.repeat(1500) }]
      const serialized = JSON.stringify({ values, count: values.length })
      vi.mocked(fetch).mockResolvedValue(okResponse(values))

      await makeClient().get('Case', {})

      const responseLog = debugSpy.mock.calls[1]?.[0]
      const [, loggedBody = ''] = responseLog.split('\n            ')
      expect(loggedBody).toHaveLength(1000)
      expect(loggedBody).toBe(serialized.slice(0, 1000))
    })
  })
})
