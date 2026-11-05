import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'
import { userRolesMigrationSql } from '../database/user-roles-schema'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql.raw(userRolesMigrationSql('payload')))
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" DROP COLUMN "role";
  DROP TYPE "payload"."enum_users_role";`)
}
