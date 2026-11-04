import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."resource_renames" (
    "id" serial PRIMARY KEY NOT NULL,
    "record" varchar NOT NULL,
    "list" varchar NOT NULL,
    "from_slug" varchar NOT NULL,
    "to_slug" varchar NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE UNIQUE INDEX "resource_renames_record_idx" ON "payload"."resource_renames" USING btree ("record");
  CREATE INDEX "resource_renames_list_idx" ON "payload"."resource_renames" USING btree ("list");
  CREATE INDEX "resource_renames_updated_at_idx" ON "payload"."resource_renames" USING btree ("updated_at");
  CREATE INDEX "resource_renames_created_at_idx" ON "payload"."resource_renames" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."resource_renames" CASCADE;`)
}
