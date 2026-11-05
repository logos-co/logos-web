import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "payload"."enum_users_role" AS ENUM('admin', 'editor');
  ALTER TABLE "payload"."users" ADD COLUMN "role" "payload"."enum_users_role" DEFAULT 'editor' NOT NULL;
  UPDATE "payload"."users" SET "role" = 'admin'
  WHERE "id" = (SELECT "id" FROM "payload"."users" ORDER BY "created_at", "id" LIMIT 1);`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."users" DROP COLUMN "role";
  DROP TYPE "payload"."enum_users_role";`)
}
