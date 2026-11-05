import assert from 'node:assert/strict'
import { test } from 'node:test'
import { handleEndpoints, type Payload } from 'payload'
import { Users } from '../Users'
import { startResourceTestCms } from './resource-test-cms'

process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'
const enabled = Boolean(process.env.CMS_TEST_DATABASE_URL)
const password = 'auth-race-password-123'

function barrier() {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}

async function request(
  payload: Payload,
  path: string,
  body: object,
  token?: string,
  method = 'POST'
) {
  return handleEndpoints({
    config: payload.config,
    payloadInstanceCacheKey: payload.db.schemaName,
    request: new Request(`http://localhost/api/users/${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `JWT ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }),
  })
}

for (const action of ['login', 'logout', 'refresh-token', 'reset-password']) {
  test(
    `${action} cannot restore an administrator demoted during the auth request`,
    { skip: !enabled, timeout: 15000 },
    async (t) => {
      const payload = await startResourceTestCms(t, [Users])
      const owner = await payload.create({
        collection: 'users',
        data: { email: 'owner@example.com', password },
      })
      const target = await payload.create({
        collection: 'users',
        data: { email: 'target@example.com', password, role: 'admin' },
      })
      const ownerLogin = await payload.login({
        collection: 'users',
        data: { email: owner.email, password },
      })
      const targetLogin = await payload.login({
        collection: 'users',
        data: { email: target.email, password },
      })
      const resetToken =
        action === 'reset-password'
          ? await payload.forgotPassword({
              collection: 'users',
              data: { email: target.email },
              disableEmail: true,
            })
          : undefined
      const changedPassword = 'changed-auth-password-123'
      const updateOne: Payload['db']['updateOne'] = payload.db.updateOne.bind(
        payload.db
      )
      const paused = barrier()
      const resume = barrier()
      let held = false
      t.after(() => resume.resolve())
      t.mock.method(
        payload.db,
        'updateOne',
        async (args: Parameters<typeof updateOne>[0]) => {
          if (
            !held &&
            args.collection === 'users' &&
            args.id === target.id &&
            args.req?.pathname === `/api/users/${action}`
          ) {
            held = true
            assert.equal(
              args.data.role,
              'admin',
              'the auth request holds the pre-demotion snapshot'
            )
            paused.resolve()
            await resume.promise
          }
          return updateOne(args)
        }
      )
      const auth = request(
        payload,
        action,
        action === 'login'
          ? { email: target.email, password }
          : action === 'reset-password'
            ? { token: resetToken, password: changedPassword }
            : {},
        action === 'login' || action === 'reset-password'
          ? undefined
          : targetLogin.token
      )
      await Promise.race([
        paused.promise,
        auth.then(() => {
          throw new Error(
            'Auth finished without reaching the concurrent-write barrier'
          )
        }),
      ])
      try {
        const demoted = await request(
          payload,
          String(target.id),
          { role: 'editor' },
          ownerLogin.token,
          'PATCH'
        )
        assert.equal(demoted.status, 200)
        assert.equal(
          (await payload.findByID({ collection: 'users', id: target.id })).role,
          'editor'
        )
      } finally {
        resume.resolve()
      }
      const response = await auth
      assert.equal(response.status, 200)
      const result = await response.json()
      if (action !== 'logout')
        assert.equal(
          result.user.role,
          'editor',
          'auth responses reflect the persisted role'
        )
      assert.equal(
        (await payload.findByID({ collection: 'users', id: target.id })).role,
        'editor'
      )
      for (const token of [
        targetLogin.token,
        result.token,
        result.refreshedToken,
      ].filter(Boolean)) {
        const forbidden = await request(
          payload,
          '',
          { email: 'escalated@example.com', password, role: 'admin' },
          token
        )
        assert.equal(
          forbidden.status,
          403,
          'old and returned tokens cannot manage accounts'
        )
      }
      const freshLogin = await request(payload, 'login', {
        email: target.email,
        password: action === 'reset-password' ? changedPassword : password,
      })
      assert.equal(freshLogin.status, 200)
      const fresh = await freshLogin.json()
      assert.equal(fresh.user.role, 'editor')
      assert.equal(
        (
          await request(
            payload,
            String(target.id),
            { name: 'Still editable', role: 'admin' },
            fresh.token,
            'PATCH'
          )
        ).status,
        200
      )
      assert.equal(
        (await payload.findByID({ collection: 'users', id: target.id })).role,
        'editor'
      )
      assert.equal(
        (
          await request(
            payload,
            '',
            { email: 'still-forbidden@example.com', password },
            fresh.token
          )
        ).status,
        403
      )
      assert.equal(
        (await payload.findByID({ collection: 'users', id: owner.id })).role,
        'admin'
      )
    }
  )
}

test(
  'a rejected profile update rolls back its role change',
  { skip: !enabled },
  async (t) => {
    const payload = await startResourceTestCms(t, [Users])
    const owner = await payload.create({
      collection: 'users',
      data: { email: 'owner@example.com', password },
    })
    const editor = await payload.create({
      collection: 'users',
      data: { email: 'editor@example.com', password },
    })
    const { token } = await payload.login({
      collection: 'users',
      data: { email: owner.email, password },
    })
    const response = await request(
      payload,
      String(editor.id),
      { role: 'admin', email: 'invalid' },
      token,
      'PATCH'
    )
    assert.equal(response.status, 400)
    assert.equal(
      (await payload.findByID({ collection: 'users', id: editor.id })).role,
      'editor'
    )
  }
)
