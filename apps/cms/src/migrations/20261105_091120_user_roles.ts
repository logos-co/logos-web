import {
  type MigrateUpArgs,
  type MigrateDownArgs,
  sql,
} from '@payloadcms/db-postgres'
import {
  userRolesMigrationSql,
  userRolesRollbackSql,
} from '../database/user-roles-schema'

export async function up({ db, payload }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql.raw(userRolesMigrationSql(payload.db.schemaName || 'public'))
  )
}

export async function down({ db, payload }: MigrateDownArgs): Promise<void> {
  await db.execute(
    sql.raw(userRolesRollbackSql(payload.db.schemaName || 'public'))
  )
}
