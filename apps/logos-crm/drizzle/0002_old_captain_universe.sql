CREATE TYPE "public"."activity_type" AS ENUM('note', 'call', 'email', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"person_id" uuid,
	"organisation_id" uuid,
	"type" "activity_type" DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_activities_one_subject_check" CHECK (num_nonnulls("crm_activities"."case_id", "crm_activities"."person_id", "crm_activities"."organisation_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "crm_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"person_id" uuid,
	"organisation_id" uuid,
	"title" text NOT NULL,
	"description" text,
	"status" "task_status" DEFAULT 'open' NOT NULL,
	"priority" "task_priority" DEFAULT 'medium' NOT NULL,
	"assignee" text NOT NULL,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_tasks_one_subject_check" CHECK (num_nonnulls("crm_tasks"."case_id", "crm_tasks"."person_id", "crm_tasks"."organisation_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_activities_case_idx" ON "crm_activities" USING btree ("case_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_activities_person_idx" ON "crm_activities" USING btree ("person_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_activities_organisation_idx" ON "crm_activities" USING btree ("organisation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_tasks_case_idx" ON "crm_tasks" USING btree ("case_id","status","due_at");--> statement-breakpoint
CREATE INDEX "crm_tasks_person_idx" ON "crm_tasks" USING btree ("person_id","status","due_at");--> statement-breakpoint
CREATE INDEX "crm_tasks_organisation_idx" ON "crm_tasks" USING btree ("organisation_id","status","due_at");