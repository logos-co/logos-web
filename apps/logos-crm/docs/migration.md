# Logos CRM — CiviCRM Migration Plan

## 1. Principles

- `apps/civi-crm` remains operational until each replacement workflow passes its cutover gate.
- CiviCRM is a migration source, not the new application's database.
- Every imported entity keeps source type, source ID, source timestamp, and migration-run ID.
- Preview, commit, retry, and reconciliation are idempotent.
- No public funnel cutover occurs in the first Logos CRM UI release.
- Redis, dual-write middleware, and a separate migration service are not introduced.

## 2. Input contract

The initial transport is an Infra-produced UTF-8 CSV export with optional BOM. PapaParse handles parsing and parser diagnostics; mapped records are validated with `drizzle-zod` schemas derived from the Drizzle tables and refined for migration-only rules. Each entity type has a versioned header contract and source-system code. Default limits are 25 MB and 50,000 rows per file.

Preview performs:

- file size and encoding checks, PapaParse header/parser diagnostics, and `drizzle-zod` row validation;
- SHA-256 checksum calculation;
- controlled-value mapping;
- create, update, unchanged, conflict, duplicate-suggestion, and error counts;
- safe row errors without echoing full personal records.

Commit accepts only a successful preview ID, the same checksum, and an idempotency key. Raw files are protected and deleted after the configured retention period.

## 3. Migration phases

### Inventory and mapping

Inventory CiviCRM contacts, organisations, cases, relationships, activities, assignments, option values, historical statuses, and funnel integrations. Version every source-to-target field and catalogue mapping.

### Representative rehearsal

Import a production-shaped but appropriately protected export into a non-production Compose environment. Validate entity counts, relationship counts, source IDs, status/stage history, ownership, timestamps, Unicode, and personal-data handling.

### Reconciliation

Run the same import twice and require stable counts. Produce machine-readable and human-readable differences for missing source IDs, mapping failures, duplicate suggestions, invalid relationships, and changed source rows.

### Incremental refresh

During the pilot, import rows changed since the previous source watermark. `source_updated_at` and file checksum prevent stale imports from overwriting newer CRM edits. A conflict is reported for manual resolution rather than silently choosing a winner.

### Parallel operation

`apps/civi-crm` remains the authoritative write path for workflows not yet cut over. Logos CRM clearly labels imported read-only records and records the latest source watermark. There is no bidirectional or hidden dual write.

### Controlled cutover

Cut over one workflow at a time:

1. announce a bounded source-write freeze;
2. capture the final source watermark and export;
3. import and reconcile counts, links, and history;
4. switch the selected workflow and public integration flag;
5. run authenticated smoke tests;
6. observe agreed error and reconciliation thresholds.

Rollback restores the previous routing flag and reopens the old write path only if no incompatible Logos CRM-only writes occurred. Otherwise, an explicit reverse-export procedure is required before rollback.

### Retirement

After every workflow and integration passes an agreed observation period, remove active CiviCRM dependencies. Archive source data under the retention policy; application deployment never deletes the source system.

## 4. Merge and identity rules

Source IDs are authoritative for repeated imports. Email, telephone, normalised names, and domains produce duplicate suggestions only. Confirmed merges preserve all source IDs and relationship links on the survivor. Imported rows targeting a merged duplicate resolve to the survivor.

## 5. Cutover gates

A workflow can cut over only when:

- required and optional field mappings are signed off;
- create/update/unchanged/conflict/error totals reconcile;
- status and stage history supports the agreed reports;
- owners and teams map to active CRM users;
- permissions and private/team/shared activity visibility are verified;
- the final import is repeatable;
- backup, restore, and rollback procedures have been rehearsed;
- funnel or other inbound callers have a separately approved routing change.

## 6. Current boundary

The public funnel continues to use its existing `apps/civi-crm` endpoint and integrations during the first Logos CRM milestone. Initial Logos CRM records come from approved imports or explicit internal creation.
