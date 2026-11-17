import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { resolveDevPayloadSecret } from '../dev-payload-secret'

describe('dev Payload secret', () => {
  it('keeps a configured PAYLOAD_SECRET', () => {
    assert.deepEqual(resolveDevPayloadSecret('configured'), {
      generated: false,
      secret: 'configured',
    })
  })

  it('generates a random secret per run when PAYLOAD_SECRET is unset', () => {
    const first = resolveDevPayloadSecret(undefined)
    const second = resolveDevPayloadSecret('')

    assert.equal(first.generated, true)
    assert.match(first.secret, /^[0-9a-f]{64}$/)
    assert.notEqual(first.secret, second.secret)
  })
})
