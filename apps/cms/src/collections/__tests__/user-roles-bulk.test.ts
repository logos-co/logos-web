import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  handleEndpoints,
  type Payload,
  type TextFieldSingleValidation,
} from 'payload'
import { Users } from '../Users'
import { startResourceTestCms } from './resource-test-cms'

process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
const enabled = Boolean(process.env.CMS_TEST_DATABASE_URL)
const password = 'bulk-role-password-123'

async function request(
  payload: Payload,
  path: string,
  body: object,
  token: string | undefined,
  method = 'PATCH'
) {
  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: payload.db.schemaName,
    request: new Request(`http://localhost/api/users${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify(body),
    }),
  })
}

async function createAccount(
  payload: Payload,
  email: string,
  role: 'admin' | 'editor'
) {
  const user = await payload.create({
    collection: 'users',
    data: { email, password, role },
  })
  const { token } = await payload.login({
    collection: 'users',
    data: { email, password },
  })
  assert.ok(token)
  return { user, token }
}

for (const originalRole of ['admin', 'editor'] as const) {
  test(
    `a rejected bulk update preserves the ${originalRole} role and existing token permissions`,
    { skip: !enabled },
    async (t) => {
      const payload = await startResourceTestCms(t, [Users])
      const owner = await createAccount(payload, 'owner@example.com', 'admin')
      const target = await createAccount(
        payload,
        'target@example.com',
        originalRole
      )
      const requestedRole = originalRole === 'admin' ? 'editor' : 'admin'
      const response = await request(
        payload,
        `?where[id][equals]=${target.user.id}`,
        { role: requestedRole, email: 'invalid' },
        owner.token
      )
      assert.equal(response.status, 400)
      const result = await response.json()
      assert.deepEqual(result.docs, [])
      assert.equal(result.errors.length, 1)
      assert.equal(result.errors[0].id, target.user.id)
      const stored = await payload.findByID({
        collection: 'users',
        id: target.user.id,
      })
      assert.equal(stored.role, originalRole)
      assert.equal(stored.email, target.user.email)
      const authenticated = await payload.auth({
        headers: new Headers({ Authorization: `JWT ${target.token}` }),
      })
      assert.equal(authenticated.user?.role, originalRole)
      const create = await request(
        payload,
        '',
        { email: 'after-failure@example.com', password },
        target.token,
        'POST'
      )
      assert.equal(create.status, originalRole === 'admin' ? 201 : 403)
    }
  )
}

test(
  'a partially rejected bulk update changes only validated accounts and supports retry',
  { skip: !enabled },
  async (t) => {
    let rejectedID: number | string | undefined
    const validateName: TextFieldSingleValidation = (
      _value,
      { id, operation }
    ) =>
      operation === 'update' && id === rejectedID
        ? 'This account cannot be renamed.'
        : true
    const payload = await startResourceTestCms(t, [
      {
        ...Users,
        fields: Users.fields.map((field) =>
          'name' in field &&
          field.name === 'name' &&
          field.type === 'text' &&
          !field.hasMany
            ? {
                ...field,
                // Exercise per-document validation in Payload's real bulk transaction.
                validate: validateName,
              }
            : field
        ),
      },
    ])
    const owner = await createAccount(payload, 'owner@example.com', 'admin')
    const accepted = await createAccount(
      payload,
      'accepted@example.com',
      'editor'
    )
    const rejected = await createAccount(
      payload,
      'rejected@example.com',
      'editor'
    )
    rejectedID = rejected.user.id
    const response = await request(
      payload,
      `?where[id][in]=${accepted.user.id},${rejected.user.id}`,
      { role: 'admin', name: 'Renamed' },
      owner.token
    )
    assert.equal(response.status, 400)
    const result = await response.json()
    assert.equal(result.docs.length, 1)
    assert.equal(result.docs[0].id, accepted.user.id)
    assert.equal(result.docs[0].role, 'admin')
    assert.equal(result.errors.length, 1)
    assert.equal(result.errors[0].id, rejected.user.id)
    const saved = await payload.findByID({
      collection: 'users',
      id: accepted.user.id,
    })
    const unchanged = await payload.findByID({
      collection: 'users',
      id: rejected.user.id,
    })
    assert.equal(saved.role, 'admin')
    assert.equal(saved.name, 'Renamed')
    assert.equal(unchanged.role, 'editor')
    assert.notEqual(unchanged.name, 'Renamed')
    assert.equal(
      (
        await request(
          payload,
          '',
          { email: 'blocked@example.com', password },
          rejected.token,
          'POST'
        )
      ).status,
      403
    )

    rejectedID = undefined
    const retry = await request(
      payload,
      `?where[id][equals]=${rejected.user.id}&select[name]=true`,
      { role: 'admin', name: 'Retried' },
      owner.token
    )
    assert.equal(retry.status, 200)
    const retried = await retry.json()
    assert.equal(retried.docs.length, 1)
    assert.equal(retried.docs[0].name, 'Retried')
    assert.equal(
      'role' in retried.docs[0],
      false,
      'role updates respect the selected response fields'
    )
    assert.equal(
      (await payload.findByID({ collection: 'users', id: rejected.user.id }))
        .role,
      'admin'
    )
    assert.equal(
      (
        await request(
          payload,
          '',
          { email: 'allowed@example.com', password },
          rejected.token,
          'POST'
        )
      ).status,
      201
    )
  }
)
