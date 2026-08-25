CREATE TYPE "public"."case_pipeline" AS ENUM('ecodev', 'movement');--> statement-breakpoint
ALTER TABLE "crm_cases" ADD COLUMN "pipeline" "case_pipeline" DEFAULT 'ecodev' NOT NULL;--> statement-breakpoint
-- Backfill. Cases carrying a funnel `profile` came in through the public
-- intake, and every funnel-created row in the Notion export is BU=Movement, so
-- those move to the Movement board. Everything else stays on Ecodev, which is
-- where the column default already put it.
UPDATE "crm_cases" SET "pipeline" = 'movement' WHERE "profile" IS NOT NULL;--> statement-breakpoint
-- Stage is now a key from `contracts/pipeline.ts` rather than free text. Only
-- the stage names this application has actually written are mapped; anything
-- else is left untouched so it stays visible as an unmapped stage rather than
-- being silently rewritten into a stage somebody would then act on.
UPDATE "crm_cases" SET "stage" = CASE "stage"
  WHEN 'Intake' THEN 'new_lead'
  WHEN 'Redirected' THEN 'redirected'
  WHEN 'Approved' THEN 'active'
  ELSE "stage"
END WHERE "pipeline" = 'movement';--> statement-breakpoint
UPDATE "crm_cases" SET "stage" = CASE "stage"
  WHEN 'Intake' THEN 'lead'
  WHEN 'Discovery' THEN 'preliminary_interest'
  WHEN 'Qualification' THEN 'qualified'
  WHEN 'Proposal' THEN 'negotiation'
  WHEN 'Approved' THEN 'confirmed'
  WHEN 'Redirected' THEN 'archive'
  ELSE "stage"
END WHERE "pipeline" = 'ecodev';--> statement-breakpoint
-- Workflow history carries stage names too. Rewritten with the same mapping so
-- a case timeline does not read as a move between a label and a key.
UPDATE "crm_case_workflow_history" SET
  "from_stage" = CASE "from_stage"
    WHEN 'Intake' THEN 'lead' WHEN 'Discovery' THEN 'preliminary_interest'
    WHEN 'Qualification' THEN 'qualified' WHEN 'Proposal' THEN 'negotiation'
    WHEN 'Approved' THEN 'confirmed' WHEN 'Redirected' THEN 'archive'
    ELSE "from_stage" END,
  "to_stage" = CASE "to_stage"
    WHEN 'Intake' THEN 'lead' WHEN 'Discovery' THEN 'preliminary_interest'
    WHEN 'Qualification' THEN 'qualified' WHEN 'Proposal' THEN 'negotiation'
    WHEN 'Approved' THEN 'confirmed' WHEN 'Redirected' THEN 'archive'
    ELSE "to_stage" END;
