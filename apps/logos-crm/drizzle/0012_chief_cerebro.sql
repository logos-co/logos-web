ALTER TABLE "scout_candidates" ADD COLUMN "assigned_to_user_id" uuid;--> statement-breakpoint
ALTER TABLE "scout_candidates" ADD COLUMN "internal_note" text;--> statement-breakpoint
ALTER TABLE "scout_candidates" ADD COLUMN "review_after_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "scout_discovery_runs" ADD COLUMN "skipped_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "scout_discovery_runs" ADD COLUMN "failure_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "scout_discovery_runs" ADD COLUMN "sources_used" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "scout_candidates" ADD CONSTRAINT "scout_candidates_assigned_to_user_id_crm_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scout_candidates_assignee_idx" ON "scout_candidates" USING btree ("assigned_to_user_id");--> statement-breakpoint
CREATE INDEX "scout_candidates_review_after_idx" ON "scout_candidates" USING btree ("review_after_at");