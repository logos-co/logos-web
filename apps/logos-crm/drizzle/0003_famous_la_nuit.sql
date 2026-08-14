CREATE TYPE "public"."notification_channel" AS ENUM('email');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('pending', 'sent', 'failed', 'skipped');--> statement-breakpoint
CREATE TABLE "crm_activity_mentions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"activity_id" uuid NOT NULL,
	"mentioned_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_notification_deliveries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"channel" "notification_channel" NOT NULL,
	"kind" text NOT NULL,
	"activity_id" uuid,
	"case_id" uuid,
	"dedupe_key" text NOT NULL,
	"status" "notification_status" DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "crm_activity_mentions" ADD CONSTRAINT "crm_activity_mentions_activity_id_crm_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."crm_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activity_mentions" ADD CONSTRAINT "crm_activity_mentions_mentioned_user_id_crm_users_id_fk" FOREIGN KEY ("mentioned_user_id") REFERENCES "public"."crm_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notification_deliveries" ADD CONSTRAINT "crm_notification_deliveries_user_id_crm_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."crm_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notification_deliveries" ADD CONSTRAINT "crm_notification_deliveries_activity_id_crm_activities_id_fk" FOREIGN KEY ("activity_id") REFERENCES "public"."crm_activities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_notification_deliveries" ADD CONSTRAINT "crm_notification_deliveries_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crm_activity_mentions_uidx" ON "crm_activity_mentions" USING btree ("activity_id","mentioned_user_id");--> statement-breakpoint
CREATE INDEX "crm_activity_mentions_user_idx" ON "crm_activity_mentions" USING btree ("mentioned_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_notification_deliveries_dedupe_uidx" ON "crm_notification_deliveries" USING btree ("dedupe_key");--> statement-breakpoint
CREATE INDEX "crm_notification_deliveries_status_idx" ON "crm_notification_deliveries" USING btree ("status","created_at");--> statement-breakpoint
CREATE INDEX "crm_notification_deliveries_user_idx" ON "crm_notification_deliveries" USING btree ("user_id");