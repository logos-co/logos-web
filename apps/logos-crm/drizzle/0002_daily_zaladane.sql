CREATE TYPE "public"."case_decision" AS ENUM('pending', 'approved', 'redirected', 'declined');--> statement-breakpoint
CREATE TYPE "public"."evaluation_stage" AS ENUM('submission', 'call', 'one_pager', 'other');--> statement-breakpoint
CREATE TABLE "crm_case_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"stage" "evaluation_stage" NOT NULL,
	"reviewer_user_id" uuid,
	"score" integer,
	"notes" text,
	"criteria_version" text NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_case_evaluations_score_range_check" CHECK ("crm_case_evaluations"."score" is null or ("crm_case_evaluations"."score" between 1 and 5))
);
--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "decision" "case_decision" DEFAULT 'pending' NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "decision_reason" text;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "decided_by_user_id" uuid;--> statement-breakpoint
ALTER TABLE "crm_case_evaluations" ADD CONSTRAINT "crm_case_evaluations_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_evaluations" ADD CONSTRAINT "crm_case_evaluations_reviewer_user_id_crm_users_id_fk" FOREIGN KEY ("reviewer_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crm_case_evaluations_case_stage_uidx" ON "crm_case_evaluations" USING btree ("case_id","stage");--> statement-breakpoint
CREATE INDEX "crm_case_evaluations_reviewer_idx" ON "crm_case_evaluations" USING btree ("reviewer_user_id");--> statement-breakpoint
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_decided_by_user_id_crm_users_id_fk" FOREIGN KEY ("decided_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;