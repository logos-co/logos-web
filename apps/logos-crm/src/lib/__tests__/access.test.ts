import assert from 'node:assert/strict'
import { test } from 'node:test'

import { isAuthorised } from '../access'

const token = 'correct-horse-battery-staple'
const basic = (user: string, password: string) =>
  `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`

test('without a token only development is allowed', () => {
  const authorization = null
  assert.equal(
    isAuthorised({ authorization, token: undefined, nodeEnv: 'development' }),
    true
  )
  for (const nodeEnv of ['production', 'test', undefined]) {
    assert.equal(
      isAuthorised({ authorization, token: undefined, nodeEnv }),
      false
    )
    assert.equal(isAuthorised({ authorization, token: '', nodeEnv }), false)
  }
})

test('a set token is required even in development', () => {
  assert.equal(
    isAuthorised({ authorization: null, token, nodeEnv: 'development' }),
    false
  )
})

test('accepts the token as a bearer or basic password', () => {
  const nodeEnv = 'production'
  for (const authorization of [
    `Bearer ${token}`,
    `bearer ${token}`,
    basic('anyone', token),
    basic('', token),
  ]) {
    assert.equal(isAuthorised({ authorization, token, nodeEnv }), true)
  }
})

test('rejects wrong or malformed credentials', () => {
  const nodeEnv = 'production'
  for (const authorization of [
    'Bearer wrong',
    `Bearer ${token}x`,
    'Bearer',
    `Token ${token}`,
    basic(token, 'wrong'),
    `Basic ${Buffer.from(token).toString('base64')}`,
    '',
  ]) {
    assert.equal(isAuthorised({ authorization, token, nodeEnv }), false)
  }
})
