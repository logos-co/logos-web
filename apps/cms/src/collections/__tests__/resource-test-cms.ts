import { randomUUID } from 'node:crypto'
import type { TestContext } from 'node:test'
import { userRolesPostgresAdapter } from '../../database/user-roles-adapter'
import { buildConfig, getPayload, type CollectionConfig } from 'payload'
import { Pool } from 'pg'
import { ResourceRenames } from '../ResourceRenames'

export async function startResourceTestCms(
  t: TestContext,
  collections: CollectionConfig[]
) {
  const connectionString = process.env.CMS_TEST_DATABASE_URL
  const schemaName = 'resource_test_' + randomUUID().replaceAll('-', '')
  const pool = new Pool({ connectionString, statement_timeout: 5000 })
  t.after(async () => {
    try {
      await pool.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`)
    } finally {
      await pool.end()
    }
  })

  const adapter = userRolesPostgresAdapter({
    pool: { connectionString, statement_timeout: 1000 },
    schemaName,
    push: true,
  })
  const config = buildConfig({
    secret: 'test-secret',
    db: {
      ...adapter,
      init: (args) => Object.assign(adapter.init(args), { pool }),
    },
    collections: [...collections, ResourceRenames],
    typescript: { autoGenerate: false },
  })
  const payload = await getPayload({ config, key: schemaName })
  t.after(() => payload.destroy())

  return payload
}
