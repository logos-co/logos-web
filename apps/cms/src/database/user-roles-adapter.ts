import {
  postgresAdapter,
  type PostgresAdapterArgs,
} from '@payloadcms/db-postgres'
import { migrateDevUserRoles } from './user-roles-schema'

export function userRolesPostgresAdapter(args: PostgresAdapterArgs) {
  const adapter = postgresAdapter(args)
  return {
    ...adapter,
    init: (options: Parameters<typeof adapter.init>[0]) => {
      const db = adapter.init(options)
      const updateOne = db.updateOne.bind(db)
      db.updateOne = (update) => {
        if (update.collection !== 'users') return updateOne(update)
        // Payload auth writes stale whole-user snapshots without field hooks.
        // Role changes are written separately after the account update succeeds.
        const data = { ...update.data }
        delete data.role
        return updateOne({ ...update, data })
      }
      const connect = db.connect!.bind(db)
      db.connect = async (options) => {
        if (
          process.env.NODE_ENV !== 'production' &&
          process.env.PAYLOAD_MIGRATING !== 'true' &&
          db.push !== false
        ) {
          const pool = new db.pg.Pool(db.poolOptions)
          try {
            await migrateDevUserRoles(pool, db.schemaName || 'public')
          } finally {
            await pool.end()
          }
        }
        await connect(options)
      }
      return db
    },
  }
}
