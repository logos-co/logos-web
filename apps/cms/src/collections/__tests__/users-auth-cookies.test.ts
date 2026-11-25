import assert from 'node:assert/strict'
import { test } from 'node:test'
import { Users } from '../Users'

test('session cookie is SameSite=Strict', () => {
  assert.equal(typeof Users.auth, 'object')
  const auth = Users.auth as Exclude<typeof Users.auth, boolean | undefined>
  assert.equal(auth.cookies?.sameSite, 'Strict')
  assert.equal(auth.cookies?.secure, process.env.NODE_ENV === 'production')
})
