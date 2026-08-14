CREATE TABLE "crm_import_errors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"source_id" text NOT NULL,
	"message" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "crm_import_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source_system" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"finished_at" timestamp with time zone,
	"status" text DEFAULT 'running' NOT NULL,
	"created_count" integer DEFAULT 0 NOT NULL,
	"duplicate_count" integer DEFAULT 0 NOT NULL,
	"error_count" integer DEFAULT 0 NOT NULL,
	"watermark" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "crm_import_errors" ADD CONSTRAINT "crm_import_errors_run_id_crm_import_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."crm_import_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "crm_import_errors_run_idx" ON "crm_import_errors" USING btree ("run_id");--> statement-breakpoint
CREATE INDEX "crm_import_runs_source_idx" ON "crm_import_runs" USING btree ("source_system","started_at");