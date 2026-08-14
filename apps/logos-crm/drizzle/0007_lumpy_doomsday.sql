CREATE TABLE "crm_export_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"resource" text NOT NULL,
	"filters" jsonb NOT NULL,
	"requested_by_user_id" uuid,
	"status" text DEFAULT 'pending' NOT NULL,
	"row_count" integer,
	"file_path" text,
	"error" text,
	"requested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"expires_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "crm_export_jobs" ADD CONSTRAINT "crm_export_jobs_requested_by_user_id_crm_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_export_jobs_status_idx" ON "crm_export_jobs" USING btree ("status","requested_at");--> statement-breakpoint
CREATE INDEX "crm_export_jobs_requester_idx" ON "crm_export_jobs" USING btree ("requested_by_user_id");