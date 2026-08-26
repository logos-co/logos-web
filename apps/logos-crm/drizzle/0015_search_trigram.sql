-- Substring search that can use an index.
--
-- Every search path in this app is `ILIKE '%term%'`, which a B-tree cannot
-- serve: Postgres scans the table. That is invisible at demo size and becomes
-- the slowest thing on the page once the Notion import lands its 563 rows and
-- keeps growing. `pg_trgm` GIN indexes are the standard answer and need no
-- change to the queries themselves.
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_cases_title_trgm_idx" ON "crm_cases" USING gin ("title" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_organisations_display_name_trgm_idx" ON "crm_organisations" USING gin ("display_name" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_organisations_domain_trgm_idx" ON "crm_organisations" USING gin ("domain" gin_trgm_ops);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "crm_people_full_name_trgm_idx" ON "crm_people" USING gin ("full_name" gin_trgm_ops);--> statement-breakpoint
-- Contact methods are how a coordinator actually arrives at a person: with an
-- address from a thread rather than a correctly spelled name.
CREATE INDEX IF NOT EXISTS "crm_contact_methods_normalised_trgm_idx" ON "crm_contact_methods" USING gin ("normalised_value" gin_trgm_ops);
