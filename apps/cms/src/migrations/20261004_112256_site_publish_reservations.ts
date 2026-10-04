import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "payload"."site_publish_reservations" (
    "id" serial PRIMARY KEY NOT NULL,
    "key" varchar NOT NULL,
    "token" varchar NOT NULL,
    "environment" varchar NOT NULL,
    "baseline_build" numeric NOT NULL,
    "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
    "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE UNIQUE INDEX "site_publish_reservations_key_idx" ON "payload"."site_publish_reservations" USING btree ("key");
  CREATE INDEX "site_publish_reservations_updated_at_idx" ON "payload"."site_publish_reservations" USING btree ("updated_at");
  CREATE INDEX "site_publish_reservations_created_at_idx" ON "payload"."site_publish_reservations" USING btree ("created_at");`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."site_publish_reservations" CASCADE;`)
}
