CREATE TYPE "public"."case_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('new', 'in_progress', 'waiting', 'resolved', 'closed');--> statement-breakpoint
CREATE TABLE "crm_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"organisation" text NOT NULL,
	"owner" text NOT NULL,
	"status" "case_status" DEFAULT 'new' NOT NULL,
	"stage" text NOT NULL,
	"priority" "case_priority" DEFAULT 'medium' NOT NULL,
	"next_action" text NOT NULL,
	"next_action_at" timestamp with time zone NOT NULL,
	"last_contact_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "crm_cases_status_idx" ON "crm_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_cases_owner_idx" ON "crm_cases" USING btree ("owner");--> statement-breakpoint
CREATE INDEX "crm_cases_updated_at_idx" ON "crm_cases" USING btree ("updated_at");