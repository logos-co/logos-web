import type { Pool } from 'pg'

function quoteSchemaName(schemaName: string): string {
  return `"${schemaName.replaceAll('"', '""')}"`
}

export function userRolesMigrationSql(schemaName: string): string {
  const schema = quoteSchemaName(schemaName)
  return `
    CREATE TYPE ${schema}."enum_users_role" AS ENUM('admin', 'editor');
    ALTER TABLE ${schema}."users" ADD COLUMN "role" ${schema}."enum_users_role" DEFAULT 'editor' NOT NULL;
    UPDATE ${schema}."users" SET "role" = 'admin'
    WHERE "id" = (SELECT "id" FROM ${schema}."users" ORDER BY "created_at", "id" LIMIT 1);
  `
}

export function userRolesRollbackSql(schemaName: string): string {
  const schema = quoteSchemaName(schemaName)
  return `
    ALTER TABLE ${schema}."users" DROP COLUMN "role";
    DROP TYPE ${schema}."enum_users_role";
  `
}

export async function migrateDevUserRoles(pool: Pool, schema: string) {
  const client = await pool.connect().catch((error: unknown) => {
    // Let Payload create a missing development database on its normal path.
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      error.code === '3D000'
    )
      return undefined
    throw error
  })
  if (!client) return
  try {
    await client.query('BEGIN')
    await client.query(
      'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
      [`${schema}:user-role-migration`]
    )
    const { rows } = await client.query<{ column_name: string }>(
      `SELECT column_name FROM information_schema.columns
       WHERE table_schema = $1 AND table_name = 'users'`,
      [schema]
    )
    // Test for the old schema, not the absence of admins: a deliberate demotion
    // must survive later restarts, including a database with no administrators.
    if (rows.length && !rows.some((row) => row.column_name === 'role')) {
      await client.query(userRolesMigrationSql(schema))
    }
    await client.query('COMMIT')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    client.release()
  }
}
