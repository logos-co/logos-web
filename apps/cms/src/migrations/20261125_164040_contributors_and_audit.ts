import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."content_change_requests" ADD COLUMN "contributors" jsonb;
  ALTER TABLE "payload"."content_change_requests" ADD COLUMN "merged_by_id" integer;
  ALTER TABLE "payload"."content_change_requests" ADD COLUMN "merged_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."content_change_requests" ADD COLUMN "promoted_by_id" integer;
  ALTER TABLE "payload"."content_change_requests" ADD COLUMN "promoted_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."content_change_requests" ADD COLUMN "published_by_id" integer;
  ALTER TABLE "payload"."content_change_requests" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "payload"."content_change_requests" ADD CONSTRAINT "content_change_requests_merged_by_id_users_id_fk" FOREIGN KEY ("merged_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."content_change_requests" ADD CONSTRAINT "content_change_requests_promoted_by_id_users_id_fk" FOREIGN KEY ("promoted_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."content_change_requests" ADD CONSTRAINT "content_change_requests_published_by_id_users_id_fk" FOREIGN KEY ("published_by_id") REFERENCES "payload"."users"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "content_change_requests_merged_by_idx" ON "payload"."content_change_requests" USING btree ("merged_by_id");
  CREATE INDEX "content_change_requests_promoted_by_idx" ON "payload"."content_change_requests" USING btree ("promoted_by_id");
  CREATE INDEX "content_change_requests_published_by_idx" ON "payload"."content_change_requests" USING btree ("published_by_id");
  UPDATE "payload"."content_change_requests" SET "contributors" = jsonb_build_array("created_by_id") WHERE "created_by_id" IS NOT NULL;`)
}

export async function down({
  db,
  payload,
  req,
}: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload"."content_change_requests" DROP CONSTRAINT "content_change_requests_merged_by_id_users_id_fk";
  
  ALTER TABLE "payload"."content_change_requests" DROP CONSTRAINT "content_change_requests_promoted_by_id_users_id_fk";
  
  ALTER TABLE "payload"."content_change_requests" DROP CONSTRAINT "content_change_requests_published_by_id_users_id_fk";
  
  DROP INDEX "payload"."content_change_requests_merged_by_idx";
  DROP INDEX "payload"."content_change_requests_promoted_by_idx";
  DROP INDEX "payload"."content_change_requests_published_by_idx";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "contributors";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "merged_by_id";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "merged_at";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "promoted_by_id";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "promoted_at";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "published_by_id";
  ALTER TABLE "payload"."content_change_requests" DROP COLUMN "published_at";`)
}
