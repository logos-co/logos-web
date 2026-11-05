import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { test } from 'node:test'
import { postgresAdapter, sql } from '@payloadcms/db-postgres'
import { buildConfig, createLocalReq, getPayload, type Payload } from 'payload'
import { Pool } from 'pg'
import { Users } from '../Users'
import { userRolesPostgresAdapter } from '../../database/user-roles-adapter'
import { up, down } from '../../migrations/20261105_091120_user_roles'

process.env.PAYLOAD_FORCE_DRIZZLE_PUSH = 'true'

const enabled = Boolean(process.env.CMS_TEST_DATABASE_URL)

for (const existingUsers of [0, 3]) {
  test(
    `role migration preserves ${existingUsers} existing accounts and supports rollback`,
    { skip: !enabled },
    async (t) => {
      const database = 'user_roles_' + randomUUID().replaceAll('-', '')
      const maintenance = new Pool({
        connectionString: process.env.CMS_TEST_DATABASE_URL,
      })
      await maintenance.query(`CREATE DATABASE "${database}"`)
      const url = new URL(process.env.CMS_TEST_DATABASE_URL!)
      url.pathname = `/${database}`
      let payload: Payload | undefined
      const pools: Pool[] = []
      t.after(async () => {
        await payload?.destroy()
        await Promise.all(pools.map((pool) => pool.end()))
        await maintenance.query(`DROP DATABASE "${database}"`)
        await maintenance.end()
      })
      const start = (legacy: boolean) => {
        const pool = new Pool({ connectionString: url.toString() })
        pools.push(pool)
        const adapter = (legacy ? postgresAdapter : userRolesPostgresAdapter)({
          pool: { connectionString: url.toString() },
          schemaName: 'payload',
          push: legacy,
        })
        return getPayload({
          key: `${database}-${legacy}`,
          config: buildConfig({
            secret: 'migration-test-secret',
            db: {
              ...adapter,
              init: (args) => Object.assign(adapter.init(args), { pool }),
            },
            collections: [
              legacy
                ? {
                    slug: 'users',
                    auth: true,
                    fields: [{ name: 'name', type: 'text' }],
                  }
                : Users,
            ],
            typescript: { autoGenerate: false },
          }),
        })
      }
      payload = await start(true)
      const identities: {
        id: string | number
        email: string
        token: string
      }[] = []
      for (let i = 0; i < existingUsers; i++) {
        const user = await payload.create({
          collection: 'users',
          data: {
            email: `legacy-${i}@example.com`,
            password: 'migration-password-123',
            name: `Legacy ${i}`,
          },
        })
        const { token } = await payload.login({
          collection: 'users',
          data: { email: user.email, password: 'migration-password-123' },
        })
        assert.ok(token)
        identities.push({ id: user.id, email: user.email, token })
      }
      // Equal timestamps still produce one deterministic administrator by ID.
      await payload.db.drizzle.execute(
        sql`UPDATE "payload"."users" SET created_at = '2026-01-01'`
      )
      const before = await payload.db.drizzle.execute(
        sql`SELECT id, email, hash, salt FROM "payload"."users" ORDER BY id`
      )
      const args = {
        db: payload.db.drizzle,
        payload,
        req: await createLocalReq({}, payload),
      }
      await up(args)
      let roles = await payload.db.drizzle.execute(
        sql`SELECT role FROM "payload"."users" ORDER BY id`
      )
      assert.deepEqual(
        roles.rows.map((row) => row.role),
        existingUsers ? ['admin', 'editor', 'editor'] : []
      )
      const after = await payload.db.drizzle.execute(
        sql`SELECT id, email, hash, salt FROM "payload"."users" ORDER BY id`
      )
      assert.deepEqual(after.rows, before.rows)
      await down(args)
      const columns = await payload.db.drizzle.execute(
        sql`SELECT column_name FROM information_schema.columns WHERE table_schema = 'payload' AND table_name = 'users' AND column_name = 'role'`
      )
      assert.equal(columns.rows.length, 0)
      await up(args)
      roles = await payload.db.drizzle.execute(
        sql`SELECT role FROM "payload"."users" ORDER BY id`
      )
      assert.deepEqual(
        roles.rows.map((row) => row.role),
        existingUsers ? ['admin', 'editor', 'editor'] : []
      )
      await payload.destroy()
      payload = await start(false)
      for (const [index, identity] of identities.entries()) {
        const { user } = await payload.auth({
          headers: new Headers({ Authorization: `JWT ${identity.token}` }),
        })
        assert.equal(user?.role, index === 0 ? 'admin' : 'editor')
        await payload.login({
          collection: 'users',
          data: { email: identity.email, password: 'migration-password-123' },
        })
        const visible = await payload.find({
          collection: 'users',
          user,
          overrideAccess: false,
        })
        assert.equal(visible.totalDocs, index === 0 ? existingUsers : 1)
        if (index > 0) {
          const result = await payload.update({
            collection: 'users',
            id: identity.id,
            data: { role: 'admin' },
            user,
            overrideAccess: false,
          })
          assert.equal(result.role, 'editor')
          await assert.rejects(
            payload.create({
              collection: 'users',
              data: {
                email: `blocked-${index}@example.com`,
                password: 'migration-password-123',
                role: 'admin',
              },
              user,
              overrideAccess: false,
            })
          )
        }
      }
      const created = await payload.create({
        collection: 'users',
        data: { email: 'new@example.com', password: 'migration-password-123' },
      })
      assert.equal(created.role, existingUsers ? 'editor' : 'admin')
    }
  )
}

test(
  'default dev schema push migrates legacy accounts once and preserves later demotions',
  { skip: !enabled },
  async (t) => {
    const schemaName = 'dev_roles_' + randomUUID().replaceAll('-', '')
    const connectionString = process.env.CMS_TEST_DATABASE_URL
    const pool = new Pool({ connectionString })
    const instances: Payload[] = []
    t.after(async () => {
      await Promise.all(instances.map((payload) => payload.destroy()))
      await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
      await pool.end()
    })
    const start = async (legacy: boolean) => {
      const adapter = (legacy ? postgresAdapter : userRolesPostgresAdapter)({
        pool: { connectionString },
        schemaName,
        // Omit push to exercise the actual default development behaviour.
      })
      const payload = await getPayload({
        key: `${schemaName}-${instances.length}`,
        config: buildConfig({
          secret: 'dev-migration-test-secret',
          db: {
            ...adapter,
            init: (args) => Object.assign(adapter.init(args), { pool }),
          },
          collections: [
            legacy
              ? {
                  slug: 'users',
                  auth: true,
                  fields: [{ name: 'name', type: 'text' }],
                }
              : Users,
          ],
          typescript: { autoGenerate: false },
        }),
      })
      instances.push(payload)
      return payload
    }
    const legacy = await start(true)
    const tokens: string[] = []
    for (let i = 0; i < 3; i++) {
      const user = await legacy.create({
        collection: 'users',
        data: {
          email: `dev-${i}@example.com`,
          password: 'dev-migration-password-123',
        },
      })
      const { token } = await legacy.login({
        collection: 'users',
        data: { email: user.email, password: 'dev-migration-password-123' },
      })
      assert.ok(token)
      tokens.push(token)
    }
    await pool.query(
      `UPDATE "${schemaName}".users SET created_at = '2026-01-01'`
    )
    const credentials = await pool.query(
      `SELECT id, email, hash, salt FROM "${schemaName}".users ORDER BY id`
    )
    const sessions = await pool.query(
      `SELECT * FROM "${schemaName}".users_sessions ORDER BY id`
    )
    await legacy.destroy()
    const current = await start(false)
    const users = await current.find({ collection: 'users', sort: 'id' })
    assert.deepEqual(
      users.docs.map((user) => user.role),
      ['admin', 'editor', 'editor']
    )
    assert.deepEqual(
      (
        await pool.query(
          `SELECT id, email, hash, salt FROM "${schemaName}".users ORDER BY id`
        )
      ).rows,
      credentials.rows
    )
    assert.deepEqual(
      (
        await pool.query(
          `SELECT * FROM "${schemaName}".users_sessions ORDER BY id`
        )
      ).rows,
      sessions.rows
    )
    for (const [index, token] of tokens.entries()) {
      const { user } = await current.auth({
        headers: new Headers({ Authorization: `JWT ${token}` }),
      })
      assert.equal(user?.role, index === 0 ? 'admin' : 'editor')
      const create = current.create({
        collection: 'users',
        data: {
          email: `created-${index}@example.com`,
          password: 'dev-migration-password-123',
        },
        user,
        overrideAccess: false,
      })
      if (index === 0) assert.equal((await create).role, 'editor')
      else await assert.rejects(create)
      const login = await current.login({
        collection: 'users',
        data: {
          email: `dev-${index}@example.com`,
          password: 'dev-migration-password-123',
        },
      })
      assert.equal(login.user?.role, index === 0 ? 'admin' : 'editor')
    }
    // A trusted maintenance operation can deliberately leave no administrator.
    await current.update({
      collection: 'users',
      id: users.docs[0]!.id,
      data: { role: 'editor' },
    })
    await current.destroy()
    const restarted = await start(false)
    assert.equal(
      (
        await restarted.find({
          collection: 'users',
          where: { role: { equals: 'admin' } },
        })
      ).totalDocs,
      0
    )
    const newUser = await restarted.create({
      collection: 'users',
      data: {
        email: 'after-restart@example.com',
        password: 'dev-migration-password-123',
      },
    })
    assert.equal(newUser.role, 'editor')
  }
)
