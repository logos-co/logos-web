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
})
