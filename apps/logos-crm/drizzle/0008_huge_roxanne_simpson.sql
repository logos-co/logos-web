CREATE TYPE "public"."scout_certainty" AS ENUM('exact', 'derived', 'ambiguous');--> statement-breakpoint
CREATE TYPE "public"."scout_entity_type" AS ENUM('organisation', 'project', 'community', 'unknown');--> statement-breakpoint
CREATE TYPE "public"."scout_evidence_field" AS ENUM('official_site', 'theme_match', 'public_repository', 'recent_release', 'public_documentation', 'contribution_path', 'ecosystem_relation', 'governance_model');--> statement-breakpoint
CREATE TYPE "public"."scout_extraction_method" AS ENUM('deterministic', 'manual', 'ai_assisted', 'synthetic');--> statement-breakpoint
CREATE TYPE "public"."scout_gate" AS ENUM('sufficient', 'insufficient', 'conflicted');--> statement-breakpoint
CREATE TYPE "public"."scout_review_decision" AS ENUM('accept', 'watch', 'reject', 'needs_evidence');--> statement-breakpoint
CREATE TYPE "public"."scout_review_state" AS ENUM('needs_review', 'accepted', 'watch', 'rejected', 'needs_evidence', 'quarantined');--> statement-breakpoint
CREATE TABLE "scout_assessments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"rubric_version" text NOT NULL,
	"gate" "scout_gate" NOT NULL,
	"gate_reason" text NOT NULL,
	"dimensions" jsonb NOT NULL,
	"conflicts" jsonb NOT NULL,
	"distinct_sources" integer NOT NULL,
	"calculated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"superseded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "scout_candidates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" "scout_entity_type" NOT NULL,
	"display_name" text NOT NULL,
	"normalised_name" text NOT NULL,
	"domain" text,
	"summary" text,
	"review_state" "scout_review_state" DEFAULT 'needs_review' NOT NULL,
	"quarantine_reason" text,
	"first_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "scout_candidates_quarantine_reason_check" CHECK ("scout_candidates"."review_state" <> 'quarantined' or "scout_candidates"."quarantine_reason" is not null)
);
--> statement-breakpoint
CREATE TABLE "scout_evidence" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"field" "scout_evidence_field" NOT NULL,
	"value" text NOT NULL,
	"source_url" text NOT NULL,
	"source_title" text,
	"content_hash" text NOT NULL,
	"excerpt" text NOT NULL,
	"extraction_method" "scout_extraction_method" NOT NULL,
	"extractor_version" text NOT NULL,
	"certainty" "scout_certainty" NOT NULL,
	"observed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone,
	"superseded_at" timestamp with time zone,
	CONSTRAINT "scout_evidence_no_contact_value_check" CHECK ("scout_evidence"."value" !~* '(^|[[:space:]])[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' and "scout_evidence"."value" !~ '\+[0-9][0-9 ()-]{6,}' and "scout_evidence"."value" !~ '[0-9]{9,}'),
	CONSTRAINT "scout_evidence_no_contact_excerpt_check" CHECK ("scout_evidence"."excerpt" !~* '(^|[[:space:]])[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}')
);
--> statement-breakpoint
CREATE TABLE "scout_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidate_id" uuid NOT NULL,
	"assessment_id" uuid,
	"decision" "scout_review_decision" NOT NULL,
	"reason" text NOT NULL,
	"actor_user_id" uuid,
	"request_id" text,
	"reviewed_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "scout_assessments" ADD CONSTRAINT "scout_assessments_candidate_id_scout_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."scout_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_evidence" ADD CONSTRAINT "scout_evidence_candidate_id_scout_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."scout_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_reviews" ADD CONSTRAINT "scout_reviews_candidate_id_scout_candidates_id_fk" FOREIGN KEY ("candidate_id") REFERENCES "public"."scout_candidates"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_reviews" ADD CONSTRAINT "scout_reviews_assessment_id_scout_assessments_id_fk" FOREIGN KEY ("assessment_id") REFERENCES "public"."scout_assessments"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "scout_reviews" ADD CONSTRAINT "scout_reviews_actor_user_id_crm_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "scout_assessments_current_uidx" ON "scout_assessments" USING btree ("candidate_id") WHERE superseded_at is null;--> statement-breakpoint
CREATE INDEX "scout_assessments_candidate_idx" ON "scout_assessments" USING btree ("candidate_id","calculated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "scout_candidates_normalised_name_uidx" ON "scout_candidates" USING btree ("normalised_name");--> statement-breakpoint
CREATE INDEX "scout_candidates_state_idx" ON "scout_candidates" USING btree ("review_state","last_observed_at");--> statement-breakpoint
CREATE INDEX "scout_evidence_candidate_idx" ON "scout_evidence" USING btree ("candidate_id","field");--> statement-breakpoint
CREATE INDEX "scout_evidence_expiry_idx" ON "scout_evidence" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "scout_reviews_candidate_idx" ON "scout_reviews" USING btree ("candidate_id","reviewed_at");