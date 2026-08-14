CREATE TABLE "crm_entity_merges" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"entity_type" text NOT NULL,
	"survivor_id" uuid NOT NULL,
	"merged_id" uuid NOT NULL,
	"actor_user_id" uuid,
	"reason" text,
	"merged_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "crm_entity_merges" ADD CONSTRAINT "crm_entity_merges_actor_user_id_crm_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."crm_users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "crm_entity_merges_merged_uidx" ON "crm_entity_merges" USING btree ("entity_type","merged_id");--> statement-breakpoint
CREATE INDEX "crm_entity_merges_survivor_idx" ON "crm_entity_merges" USING btree ("entity_type","survivor_id");