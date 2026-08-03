import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'

import { getServerEnv } from '@/server/env'

import * as schema from './schema'

interface DatabaseGlobal {
  logosCrmDatabase?: NodePgDatabase<typeof schema>
  logosCrmPool?: Pool
}

const databaseGlobal = globalThis as typeof globalThis & DatabaseGlobal

export const pool =
  databaseGlobal.logosCrmPool ??
  new Pool({
    connectionString: getServerEnv().DATABASE_URL,
    max: 10,
  })

export const db = databaseGlobal.logosCrmDatabase ?? drizzle(pool, { schema })

if (process.env.NODE_ENV !== 'production') {
  databaseGlobal.logosCrmPool = pool
  databaseGlobal.logosCrmDatabase = db
}
