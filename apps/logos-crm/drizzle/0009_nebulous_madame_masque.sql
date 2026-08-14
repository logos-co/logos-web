CREATE TABLE "scout_discovery_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"mode" text NOT NULL,
	"requested_by_user_id" uuid,
	"request_id" text,
	"discovered_count" integer DEFAULT 0 NOT NULL,
	"quarantined_count" integer DEFAULT 0 NOT NULL,
	"note" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "scout_discovery_runs" ADD CONSTRAINT "scout_discovery_runs_requested_by_user_id_crm_users_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scout_discovery_runs_started_idx" ON "scout_discovery_runs" USING btree ("started_at");