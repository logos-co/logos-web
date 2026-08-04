CREATE TYPE "public"."contact_method_type" AS ENUM('email', 'phone', 'url', 'messaging');--> statement-breakpoint
CREATE TYPE "public"."directory_status" AS ENUM('prospect', 'active', 'inactive');--> statement-breakpoint
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
CREATE TABLE "crm_organisations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" text NOT NULL,
	"normalised_name" text NOT NULL,
	"domain" text,
	"website" text,
	"status" "directory_status" DEFAULT 'prospect' NOT NULL,
	"summary" text,
	"source_system" text,
	"external_id" text,
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
	"source_system" text,
	"external_id" text,
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
ALTER TABLE "crm_case_organisations" ADD CONSTRAINT "crm_case_organisations_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_organisations" ADD CONSTRAINT "crm_case_organisations_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_people" ADD CONSTRAINT "crm_case_people_case_id_crm_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."crm_cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_case_people" ADD CONSTRAINT "crm_case_people_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_methods" ADD CONSTRAINT "crm_contact_methods_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_contact_methods" ADD CONSTRAINT "crm_contact_methods_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_person_organisation_relationships" ADD CONSTRAINT "crm_person_organisation_relationships_person_id_crm_people_id_fk" FOREIGN KEY ("person_id") REFERENCES "public"."crm_people"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "crm_person_organisation_relationships" ADD CONSTRAINT "crm_person_organisation_relationships_organisation_id_crm_organisations_id_fk" FOREIGN KEY ("organisation_id") REFERENCES "public"."crm_organisations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crm_case_organisations_uidx" ON "crm_case_organisations" USING btree ("case_id","organisation_id");--> statement-breakpoint
CREATE INDEX "crm_case_organisations_org_idx" ON "crm_case_organisations" USING btree ("organisation_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_case_people_uidx" ON "crm_case_people" USING btree ("case_id","person_id");--> statement-breakpoint
CREATE INDEX "crm_case_people_person_idx" ON "crm_case_people" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "crm_contact_methods_person_idx" ON "crm_contact_methods" USING btree ("person_id");--> statement-breakpoint
CREATE INDEX "crm_contact_methods_organisation_idx" ON "crm_contact_methods" USING btree ("organisation_id");--> statement-breakpoint
CREATE INDEX "crm_contact_methods_normalised_value_idx" ON "crm_contact_methods" USING btree ("normalised_value");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_organisations_normalised_name_uidx" ON "crm_organisations" USING btree ("normalised_name");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_organisations_external_uidx" ON "crm_organisations" USING btree ("source_system","external_id");--> statement-breakpoint
CREATE INDEX "crm_organisations_status_idx" ON "crm_organisations" USING btree ("status");--> statement-breakpoint
CREATE INDEX "crm_organisations_domain_idx" ON "crm_organisations" USING btree ("domain");--> statement-breakpoint
CREATE INDEX "crm_people_full_name_idx" ON "crm_people" USING btree ("full_name");--> statement-breakpoint
CREATE INDEX "crm_people_status_idx" ON "crm_people" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_people_external_uidx" ON "crm_people" USING btree ("source_system","external_id");--> statement-breakpoint
CREATE UNIQUE INDEX "crm_person_org_relationship_uidx" ON "crm_person_organisation_relationships" USING btree ("person_id","organisation_id","relationship_type");--> statement-breakpoint
CREATE INDEX "crm_person_org_organisation_idx" ON "crm_person_organisation_relationships" USING btree ("organisation_id");