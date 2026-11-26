import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import type { PayloadRequest } from 'payload'

import {
  authenticatedCollectionAccess,
  collapsibleHasRequiredField,
} from '../shared-fields'

describe('collapsibleHasRequiredField', () => {
  it('detects direct required fields', () => {
    assert.equal(
      collapsibleHasRequiredField([
        { name: 'optional', type: 'text' },
        { name: 'required', type: 'text', required: true },
      ]),
      true
    )
  })

  it('detects required fields nested in rows and arrays', () => {
    assert.equal(
      collapsibleHasRequiredField([
        {
          type: 'row',
          fields: [
            {
              name: 'items',
              type: 'array',
              fields: [{ name: 'name', type: 'text', required: true }],
            },
          ],
        },
      ]),
      true
    )
  })

  it('returns false when no nested field is required', () => {
    assert.equal(
      collapsibleHasRequiredField([
        {
          type: 'collapsible',
          label: 'Image',
          fields: [{ name: 'imageSrc', type: 'text' }],
        },
      ]),
      false
    )
  })
})

describe('authenticatedCollectionAccess', () => {
  const read = authenticatedCollectionAccess?.read
  const check = (user: unknown) =>
    read?.({ req: { user } as unknown as PayloadRequest })

  it('denies anonymous reads', () => {
    assert.equal(check(null), false)
  })

  it('allows reads with a session', () => {
    assert.equal(check({ id: 1 }), true)
  })
})
