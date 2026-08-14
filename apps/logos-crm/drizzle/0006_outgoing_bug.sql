CREATE TYPE "public"."privacy_request_status" AS ENUM('received', 'in_progress', 'completed', 'refused');--> statement-breakpoint
CREATE TYPE "public"."privacy_request_type" AS ENUM('access', 'rectification', 'erasure', 'objection');--> statement-breakpoint
CREATE TABLE "crm_privacy_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"type" "privacy_request_type" NOT NULL,
	"status" "privacy_request_status" DEFAULT 'received' NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"handled_by_user_id" uuid,
	"notes" text
);
--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "do_not_contact" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "do_not_contact_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "do_not_contact_reason" text;--> statement-breakpoint
ALTER TABLE "crm_people" ADD COLUMN "anonymised_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "crm_privacy_requests" ADD CONSTRAINT "crm_privacy_requests_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_privacy_requests" ADD CONSTRAINT "crm_privacy_requests_handled_by_user_id_crm_users_id_fk" FOREIGN KEY ("handled_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_privacy_requests_person_idx" ON "crm_privacy_requests" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "crm_privacy_requests_status_idx" ON "crm_privacy_requests" USING btree ("status","received_at");