CREATE TYPE "public"."case_integration_stage" AS ENUM('not_started', 'to_reach_out', 'assess_value_proposition', 'engaged', 'regular_contact', 'ready_for_integration');--> statement-breakpoint
ALTER TABLE "crm_activities" ADD COLUMN "edited_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD COLUMN "edited_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD COLUMN "deleted_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "integration_stage" "case_integration_stage";--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_edited_by_user_id_crm_users_id_fk" FOREIGN KEY ("edited_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_deleted_by_user_id_crm_users_id_fk" FOREIGN KEY ("deleted_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;