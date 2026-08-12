/**
 * Integration tests truncate every CRM table, so the target database is named
 * by its own variable. Falling back to `DATABASE_URL` would let a plain
 * `pnpm test` wipe whatever database the developer happens to be running.
 */
import { afterAll } from 'vitest'

const testDatabaseUrl = process.env.TEST_DATABASE_URL

if (testDatabaseUrl) {
  process.env.DATABASE_URL = testDatabaseUrl

  // Closing the pool per suite would break any later suite in the same file,
  // so the connection is released once, after the whole file has finished.
  afterAll(async () => {
    const { pool } = await import('@/server/db')
    await pool.end()
  })
} else if (!process.env.DATABASE_URL) {
  // Unit tests never open a connection; this only keeps env parsing happy for
  // modules that read the URL at import time.
  process.env.DATABASE_URL = 'postgresql://unused:unused@127.0.0.1:1/unused'
}
