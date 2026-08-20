CREATE TABLE "scout_discovery_briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"purpose" text NOT NULL,
	"query" text NOT NULL,
	"organisation_types" jsonb NOT NULL,
	"themes" jsonb NOT NULL,
	"exclusions" jsonb NOT NULL,
	"regions" jsonb NOT NULL,
	"active_within_months" integer,
	"source_types" jsonb NOT NULL,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "scout_events" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"event_type" text NOT NULL,
	"candidate_id" uuid,
	"run_id" uuid,
	"actor_user_id" uuid,
	"request_id" text,
	"metadata" jsonb NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scout_events_type_check" CHECK ("scout_events"."event_type" in ('candidate_opened', 'source_opened', 'comparison_opened', 'review_recorded'))
);
--> statement-breakpoint
CREATE TABLE "scout_evidence_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"fields" jsonb NOT NULL,
	"note" text NOT NULL,
	"status" text DEFAULT 'open' NOT NULL,
	"assigned_to_user_id" uuid,
	"due_at" timestamp with time zone,
	"created_by_user_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "scout_evidence_requests_status_check" CHECK ("scout_evidence_requests"."status" in ('open', 'completed'))
);
--> statement-breakpoint
ALTER TABLE "scout_discovery_runs" ADD COLUMN "brief_id" uuid;--> statement-breakpoint
ALTER TABLE "scout_reviews" ADD COLUMN "reason_category" text;--> statement-breakpoint
ALTER TABLE "scout_discovery_briefs" ADD CONSTRAINT "scout_discovery_briefs_created_by_user_id_crm_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_events" ADD CONSTRAINT "scout_events_candidate_id_scout_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."scout_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_events" ADD CONSTRAINT "scout_events_run_id_scout_discovery_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."scout_discovery_runs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_events" ADD CONSTRAINT "scout_events_actor_user_id_crm_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_evidence_requests" ADD CONSTRAINT "scout_evidence_requests_candidate_id_scout_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."scout_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_evidence_requests" ADD CONSTRAINT "scout_evidence_requests_assigned_to_user_id_crm_users_id_fk" FOREIGN KEY ("assigned_to_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_evidence_requests" ADD CONSTRAINT "scout_evidence_requests_created_by_user_id_crm_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scout_discovery_briefs_updated_idx" ON "scout_discovery_briefs" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "scout_events_candidate_idx" ON "scout_events" USING btree ("candidate_id","occurred_at");--> statement-breakpoint
CREATE INDEX "scout_events_type_idx" ON "scout_events" USING btree ("event_type","occurred_at");--> statement-breakpoint
CREATE INDEX "scout_evidence_requests_candidate_idx" ON "scout_evidence_requests" USING btree ("candidate_id","status");--> statement-breakpoint
ALTER TABLE "scout_discovery_runs" ADD CONSTRAINT "scout_discovery_runs_brief_id_scout_discovery_briefs_id_fk" FOREIGN KEY ("brief_id") REFERENCES "public"."scout_discovery_briefs"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scout_discovery_runs_brief_idx" ON "scout_discovery_runs" USING btree ("brief_id","started_at");