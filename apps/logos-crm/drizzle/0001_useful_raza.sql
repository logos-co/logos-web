CREATE TABLE "crm_intake_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"submission_id" text NOT NULL,
	"form_name" text NOT NULL,
	"payload" jsonb NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone,
	"case_id" uuid,
	"person_id" uuid,
	"error" text
);
--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "lead_source" text;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "profile" text;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "summary" text;--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "consent_newsletter" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "consent_events" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "consent_recorded_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_intake_submissions" ADD CONSTRAINT "crm_intake_submissions_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_intake_submissions" ADD CONSTRAINT "crm_intake_submissions_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crm_intake_submissions_submission_uidx" ON "crm_intake_submissions" USING btree ("submission_id");--> statement-breakpoint
CREATE INDEX "crm_intake_submissions_unprocessed_idx" ON "crm_intake_submissions" USING btree ("received_at") WHERE "crm_intake_submissions"."processed_at" is null;