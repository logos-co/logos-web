CREATE TYPE "public"."activity_type" AS ENUM('note', 'call', 'email', 'meeting');--> statement-breakpoint
CREATE TYPE "public"."case_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."case_status" AS ENUM('new', 'in_progress', 'waiting', 'resolved', 'closed');--> statement-breakpoint
CREATE TYPE "public"."change_source" AS ENUM('app', 'import', 'system');--> statement-breakpoint
CREATE TYPE "public"."contact_method_type" AS ENUM('email', 'phone', 'url', 'messaging');--> statement-breakpoint
CREATE TYPE "public"."directory_status" AS ENUM('prospect', 'active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('open', 'completed', 'cancelled');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('pending', 'active', 'suspended');--> statement-breakpoint
CREATE TABLE "crm_activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid,
	"person_id" uuid,
	"organisation_id" uuid,
	"type" "activity_type" DEFAULT 'note' NOT NULL,
	"body" text NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_activities_one_subject_check" CHECK (num_nonnulls("crm_activities"."case_id", "crm_activities"."person_id", "crm_activities"."organisation_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "crm_audit_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"action" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"request_id" text,
	"summary" text,
	"changes" jsonb
);
--> statement-breakpoint
CREATE TABLE "crm_case_assignments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"owner_user_id" uuid,
	"team_id" uuid,
	"valid_from" timestamp with time zone DEFAULT now() NOT NULL,
	"valid_to" timestamp with time zone,
	"assigned_by_user_id" uuid,
	"reason" text,
	"source" "change_source" DEFAULT 'app' NOT NULL,
	CONSTRAINT "crm_case_assignments_interval_check" CHECK ("crm_case_assignments"."valid_to" IS NULL OR "crm_case_assignments"."valid_to" >= "crm_case_assignments"."valid_from")
);
--> statement-breakpoint
CREATE TABLE "crm_case_organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"relationship_role" text DEFAULT 'participant' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_case_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"person_id" uuid NOT NULL,
	"relationship_role" text DEFAULT 'contact' NOT NULL,
	"is_primary" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_case_workflow_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence" bigserial NOT NULL,
	"case_id" uuid NOT NULL,
	"from_status" "case_status",
	"to_status" "case_status" NOT NULL,
	"from_stage" text,
	"to_stage" text,
	"effective_at" timestamp with time zone NOT NULL,
	"recorded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"actor_user_id" uuid,
	"reason" text,
	"source" "change_source" DEFAULT 'app' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_cases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"owner_user_id" uuid,
	"team_id" uuid,
	"status" "case_status" DEFAULT 'new' NOT NULL,
	"stage" text NOT NULL,
	"priority" "case_priority" DEFAULT 'medium' NOT NULL,
	"next_action" text,
	"next_action_at" timestamp with time zone,
	"last_contact_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_contact_methods" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid,
	"organisation_id" uuid,
	"type" "contact_method_type" NOT NULL,
	"display_value" text NOT NULL,
	"normalised_value" text NOT NULL,
	"label" text,
	"is_preferred" boolean DEFAULT false NOT NULL,
	"is_suppressed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_contact_methods_one_owner_check" CHECK (num_nonnulls("crm_contact_methods"."person_id", "crm_contact_methods"."organisation_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "crm_external_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"source_updated_at" timestamp with time zone,
	"import_run_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"normalised_name" text NOT NULL,
	"domain" text,
	"website" text,
	"status" "directory_status" DEFAULT 'prospect' NOT NULL,
	"summary" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_people" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"preferred_name" text,
	"role_title" text,
	"status" "directory_status" DEFAULT 'prospect' NOT NULL,
	"summary" text,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_person_organisation_relationships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"person_id" uuid NOT NULL,
	"organisation_id" uuid NOT NULL,
	"relationship_type" text DEFAULT 'member' NOT NULL,
	"title" text,
	"is_primary" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
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
	"assignee_user_id" uuid,
	"due_at" timestamp with time zone NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "crm_tasks_one_subject_check" CHECK (num_nonnulls("crm_tasks"."case_id", "crm_tasks"."person_id", "crm_tasks"."organisation_id") = 1)
);
--> statement-breakpoint
CREATE TABLE "crm_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"normalised_name" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_user_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"team_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_subject" text,
	"email" text NOT NULL,
	"normalised_email" text NOT NULL,
	"display_name" text NOT NULL,
	"status" "user_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_activities" ADD CONSTRAINT "crm_activities_created_by_user_id_crm_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_audit_events" ADD CONSTRAINT "crm_audit_events_actor_user_id_crm_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_assignments" ADD CONSTRAINT "crm_case_assignments_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_assignments" ADD CONSTRAINT "crm_case_assignments_owner_user_id_crm_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_assignments" ADD CONSTRAINT "crm_case_assignments_team_id_crm_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."crm_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_assignments" ADD CONSTRAINT "crm_case_assignments_assigned_by_user_id_crm_users_id_fk" FOREIGN KEY ("assigned_by_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_organisations" ADD CONSTRAINT "crm_case_organisations_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_organisations" ADD CONSTRAINT "crm_case_organisations_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_people" ADD CONSTRAINT "crm_case_people_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_people" ADD CONSTRAINT "crm_case_people_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_workflow_history" ADD CONSTRAINT "crm_case_workflow_history_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_workflow_history" ADD CONSTRAINT "crm_case_workflow_history_actor_user_id_crm_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_owner_user_id_crm_users_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_cases" ADD CONSTRAINT "crm_cases_team_id_crm_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."crm_teams"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_methods" ADD CONSTRAINT "crm_contact_methods_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_methods" ADD CONSTRAINT "crm_contact_methods_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_person_organisation_relationships" ADD CONSTRAINT "crm_person_organisation_relationships_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_person_organisation_relationships" ADD CONSTRAINT "crm_person_organisation_relationships_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_tasks" ADD CONSTRAINT "crm_tasks_assignee_user_id_crm_users_id_fk" FOREIGN KEY ("assignee_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_user_teams" ADD CONSTRAINT "crm_user_teams_user_id_crm_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."crm_users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_user_teams" ADD CONSTRAINT "crm_user_teams_team_id_crm_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."crm_teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_activities_case_idx" ON "crm_activities" USING btree ("case_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_activities_person_idx" ON "crm_activities" USING btree ("person_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_activities_organisation_idx" ON "crm_activities" USING btree ("organisation_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_audit_events_entity_idx" ON "crm_audit_events" USING btree ("entity_type","entity_id","occurred_at");--> statement-breakpoint
CREATE INDEX "crm_audit_events_occurred_at_idx" ON "crm_audit_events" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "crm_audit_events_actor_idx" ON "crm_audit_events" USING btree ("actor_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_case_assignments_open_uidx" ON "crm_case_assignments" USING btree ("case_id") WHERE "crm_case_assignments"."valid_to" IS NULL;--> statement-breakpoint
CREATE INDEX "crm_case_assignments_case_idx" ON "crm_case_assignments" USING btree ("case_id","valid_from");--> statement-breakpoint
CREATE INDEX "crm_case_assignments_owner_idx" ON "crm_case_assignments" USING btree ("owner_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_case_organisations_uidx" ON "crm_case_organisations" USING btree ("case_id","organisation_id");--> statement-breakpoint
CREATE INDEX "crm_case_organisations_org_idx" ON "crm_case_organisations" USING btree ("organisation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_case_people_uidx" ON "crm_case_people" USING btree ("case_id","person_id");--> statement-breakpoint
CREATE INDEX "crm_case_people_person_idx" ON "crm_case_people" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "crm_case_workflow_history_case_idx" ON "crm_case_workflow_history" USING btree ("case_id","effective_at");--> statement-breakpoint
CREATE INDEX "crm_case_workflow_history_to_status_idx" ON "crm_case_workflow_history" USING btree ("to_status","effective_at");--> statement-breakpoint
CREATE INDEX "crm_cases_status_idx" ON "crm_cases" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_cases_owner_idx" ON "crm_cases" USING btree ("owner_user_id");--> statement-breakpoint
CREATE INDEX "crm_cases_team_idx" ON "crm_cases" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "crm_cases_updated_at_idx" ON "crm_cases" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "crm_cases_last_contact_idx" ON "crm_cases" USING btree ("last_contact_at");--> statement-breakpoint
CREATE INDEX "crm_contact_methods_person_idx" ON "crm_contact_methods" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "crm_contact_methods_organisation_idx" ON "crm_contact_methods" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "crm_contact_methods_normalised_value_idx" ON "crm_contact_methods" USING btree ("normalised_value");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_external_identities_source_uidx" ON "crm_external_identities" USING btree ("source_system","entity_type","source_id");--> statement-breakpoint
CREATE INDEX "crm_external_identities_entity_idx" ON "crm_external_identities" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_organisations_normalised_name_uidx" ON "crm_organisations" USING btree ("normalised_name");--> statement-breakpoint
CREATE INDEX "crm_organisations_status_idx" ON "crm_organisations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_organisations_domain_idx" ON "crm_organisations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "crm_people_full_name_idx" ON "crm_people" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "crm_people_status_idx" ON "crm_people" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_person_org_relationship_uidx" ON "crm_person_organisation_relationships" USING btree ("person_id","organisation_id","relationship_type");--> statement-breakpoint
CREATE INDEX "crm_person_org_organisation_idx" ON "crm_person_organisation_relationships" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "crm_tasks_case_idx" ON "crm_tasks" USING btree ("case_id","status","due_at");--> statement-breakpoint
CREATE INDEX "crm_tasks_person_idx" ON "crm_tasks" USING btree ("person_id","status","due_at");--> statement-breakpoint
CREATE INDEX "crm_tasks_organisation_idx" ON "crm_tasks" USING btree ("organisation_id","status","due_at");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_teams_normalised_name_uidx" ON "crm_teams" USING btree ("normalised_name");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_user_teams_uidx" ON "crm_user_teams" USING btree ("user_id","team_id");--> statement-breakpoint
CREATE INDEX "crm_user_teams_team_idx" ON "crm_user_teams" USING btree ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_users_normalised_email_uidx" ON "crm_users" USING btree ("normalised_email");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_users_external_subject_uidx" ON "crm_users" USING btree ("external_subject");--> statement-breakpoint
CREATE INDEX "crm_users_status_idx" ON "crm_users" USING btree ("status");