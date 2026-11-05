import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleEndpoints, type Payload } from 'payload'
import { Users } from '../Users'
import { BuilderResources } from '../BuilderResources'
import { startResourceTestCms } from './resource-test-cms'

// Each case uses a fresh schema with the same collection shape.
process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'

const enabled = Boolean(process.env.CMS_TEST_DATABASE_URL)
const password = 'secure-test-password-123'

async function request(
  payload: Payload,
  path: string,
  method = 'GET',
  body?: object,
  token?: string
) {
  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: payload.db.schemaName,
    request: new Request(`http://localhost/api/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `JWT ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
  })
}

async function login(
  payload: Payload,
  email: string,
  suppliedPassword = password
) {
  const response = await request(payload, 'users/login', 'POST', {
    email,
    password: suppliedPassword,
  })
  assert.equal(response.status, 200)
  const result = await response.json()
  assert.equal(typeof result.token, 'string')
  return result.token as string
}

for (const { concurrent, path } of [
  { concurrent: false, path: 'users/first-register' },
  { concurrent: true, path: 'users/first-register/' },
  { concurrent: true, path: 'users/FIRST-REGISTER/' },
  { concurrent: true, path: 'users/First-Register' },
]) {
  test(
    `first registration creates one administrator (${path}, concurrent=${concurrent})`,
    { skip: !enabled },
    async (t) => {
      const payload = await startResourceTestCms(t, [Users])
      const register = (email: string) =>
        request(payload, path, 'POST', {
          email,
          password,
          role: email === 'first@example.com' ? 'editor' : 'admin',
        })
      const responses = concurrent
        ? await Promise.all([
            register('first@example.com'),
            register('second@example.com'),
          ])
        : [
            await register('first@example.com'),
            await register('second@example.com'),
          ]
      assert.deepEqual(responses.map((r) => r.status).sort(), [200, 403])
      const users = await payload.find({ collection: 'users' })
      assert.equal(users.totalDocs, 1)
      assert.equal(users.docs[0]?.role, 'admin')
      const response = await request(payload, 'users', 'POST', {
        email: 'anonymous@example.com',
        password,
        role: 'admin',
      })
      assert.equal(response.status, 403)
    }
  )
}

test(
  'REST user permissions block escalation and preserve editor content access',
  { skip: !enabled },
  async (t) => {
    const payload = await startResourceTestCms(t, [Users, BuilderResources])
    const admin = await payload.create({
      collection: 'users',
      data: { email: 'admin@example.com', password },
    })
    const adminToken = await login(payload, admin.email)
    const created = await request(
      payload,
      'users',
      'POST',
      { email: 'editor@example.com', password },
      adminToken
    )
    assert.equal(created.status, 201)
    const editor = (await created.json()).doc
    assert.equal(editor.role, 'editor')
    const editorToken = await login(payload, editor.email)
    const other = await payload.create({
      collection: 'users',
      data: { email: 'other@example.com', password },
    })

    for (const token of [undefined, editorToken]) {
      assert.equal(
        (
          await request(
            payload,
            'users',
            'POST',
            { email: 'attacker@example.com', password, role: 'admin' },
            token
          )
        ).status,
        403
      )
      assert.ok(
        [403, 404].includes(
          (await request(payload, `users/${other.id}`, 'GET', undefined, token))
            .status
        )
      )
      assert.ok(
        [403, 404].includes(
          (
            await request(
              payload,
              `users/${other.id}`,
              'PATCH',
              { password: 'attacker-password', role: 'admin' },
              token
            )
          ).status
        )
      )
      assert.ok(
        [403, 404].includes(
          (
            await request(
              payload,
              `users/${other.id}`,
              'DELETE',
              undefined,
              token
            )
          ).status
        )
      )
      assert.equal(
        (
          await request(
            payload,
            'users/unlock',
            'POST',
            { email: other.email },
            token
          )
        ).status,
        403
      )
    }

    const list = await request(payload, 'users', 'GET', undefined, editorToken)
    assert.equal(list.status, 200)
    assert.deepEqual(
      (await list.json()).docs.map((user: { id: number }) => user.id),
      [editor.id]
    )
    const update = await request(
      payload,
      `users/${editor.id}`,
      'PATCH',
      { role: 'admin', name: 'Updated editor' },
      editorToken
    )
    assert.equal(update.status, 200)
    assert.equal((await update.json()).doc.role, 'editor')
    const bulk = await request(
      payload,
      'users?where[id][exists]=true',
      'PATCH',
      { role: 'admin', name: 'Bulk edit' },
      editorToken
    )
    assert.equal(bulk.status, 200)
    assert.deepEqual(
      (await bulk.json()).docs.map((user: { id: number }) => user.id),
      [editor.id]
    )
    assert.equal(
      (await payload.findByID({ collection: 'users', id: other.id })).role,
      'editor'
    )
    assert.equal(
      (await payload.findByID({ collection: 'users', id: editor.id })).role,
      'editor'
    )
    assert.equal(
      (
        await request(
          payload,
          'users?where[id][exists]=true',
          'DELETE',
          undefined,
          editorToken
        )
      ).status,
      403
    )
    await login(payload, other.email)

    const access = await request(
      payload,
      'access',
      'GET',
      undefined,
      editorToken
    )
    const permissions = await access.json()
    assert.equal(permissions.canAccessAdmin, true)
    assert.equal(permissions.collections['builder-resources'].create, true)
    assert.equal(permissions.collections['builder-resources'].update, true)
    assert.equal(permissions.collections['builder-resources'].delete, true)

    const profile = await request(
      payload,
      `users/${editor.id}`,
      'PATCH',
      { email: 'renamed@example.com', password: 'changed-password-123' },
      editorToken
    )
    assert.equal(profile.status, 200)
    await login(payload, 'renamed@example.com', 'changed-password-123')
    const promoted = await request(
      payload,
      `users/${other.id}`,
      'PATCH',
      { role: 'admin' },
      adminToken
    )
    assert.equal(promoted.status, 200)
    const otherToken = await login(payload, other.email)
    assert.equal(
      (
        await request(
          payload,
          `users/${admin.id}`,
          'GET',
          undefined,
          otherToken
        )
      ).status,
      200
    )
    assert.equal(
      (
        await request(
          payload,
          `users/${other.id}`,
          'PATCH',
          { role: 'editor' },
          adminToken
        )
      ).status,
      200
    )
    // A token issued while the user was an administrator must lose that access.
    assert.ok(
      [403, 404].includes(
        (
          await request(
            payload,
            `users/${admin.id}`,
            'PATCH',
            { password: 'hijacked-password' },
            otherToken
          )
        ).status
      )
    )
    assert.equal(
      (
        await request(
          payload,
          'users',
          'POST',
          { email: 'stale@example.com', password, role: 'admin' },
          otherToken
        )
      ).status,
      403
    )
    assert.ok(
      [403, 404].includes(
        (
          await request(
            payload,
            `users/${admin.id}`,
            'DELETE',
            undefined,
            adminToken
          )
        ).status
      )
    )
    assert.equal(
      (
        await request(
          payload,
          `users/${admin.id}`,
          'PATCH',
          { role: 'editor' },
          adminToken
        )
      ).status,
      200
    )
    assert.equal(
      (await payload.findByID({ collection: 'users', id: admin.id })).role,
      'admin'
    )
    assert.equal(
      (
        await request(
          payload,
          `users/${other.id}`,
          'DELETE',
          undefined,
          adminToken
        )
      ).status,
      200
    )
  }
)
