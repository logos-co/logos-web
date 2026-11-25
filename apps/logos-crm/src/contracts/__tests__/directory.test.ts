import assert from 'node:assert/strict'
import { test } from 'node:test'

import {
  createOrganisationSchema,
  directoryListQuerySchema,
} from '../directory'

test('website accepts only http and https', () => {
  const parse = (website: string) =>
    createOrganisationSchema.safeParse({ displayName: 'Logos', website })
      .success
  assert.equal(parse('https://logos.co'), true)
  assert.equal(parse('http://logos.co'), true)
  assert.equal(parse(''), true)
  assert.equal(parse('javascript:alert(1)'), false)
  assert.equal(parse('data:text/html,hi'), false)
  assert.equal(parse('ftp://logos.co'), false)
})

test('list query pages with bounded limit and offset', () => {
  assert.deepEqual(directoryListQuerySchema.parse({}), {
    limit: 500,
    offset: 0,
  })
  assert.deepEqual(
    directoryListQuerySchema.parse({ limit: '20', offset: '40' }),
    {
      limit: 20,
      offset: 40,
    }
  )
  for (const query of [{ limit: '0' }, { limit: '501' }, { offset: '-1' }]) {
    assert.equal(directoryListQuerySchema.safeParse(query).success, false)
  }
})
