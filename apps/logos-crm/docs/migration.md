# Logos CRM - Migration Plan

> Revised for the CiviCRM shutdown. The earlier version of this document assumed
> `apps/civi-crm` would stay the authoritative write path through a long parallel-run
> period and that data would arrive as repeated CiviCRM CSV exports. Neither holds:
> [logos-co/logos-web#134](https://github.com/logos-co/logos-web/pull/134) removes the
> CiviCRM integration entirely and leaves `apps/civi-crm` as nothing but the host of
> the public funnel intake endpoint.

## 1. What actually happens now

There is no long parallel run. There is a **short transition with two data sources**:

1. **CiviCRM - one-time historical dump.** Taken from the running instance before it is
   switched off, following [`civicrm-export-checklist.md`](civicrm-export-checklist.md).
   After that, CiviCRM is not a live source, an integration, or a fallback. It is a
   frozen archive.
2. **Notion - the bridge period source of record.** After #134 merges, the intake
   endpoint writes submissions to Notion (and forwards the steward form to n8n).
   Everything a coordinator does between the CiviCRM shutdown and the Logos CRM
   cutover exists only in Notion. It has to be imported too.

Missing the second source is the main risk in this plan. A migration that imports only
the CiviCRM dump will silently lose every applicant received during the bridge period.

## 2. Principles

- Every imported record keeps its source system, source ID, source timestamp, and
  migration-run ID.
- Preview, commit, retry, and reconciliation are idempotent.
- Email is never the sole durable identity key.
- No dual-write. When Logos CRM takes over intake it becomes the single canonical
  write, and Notion / n8n delivery becomes a Graphile Worker follow-up job with an
  idempotency key - not a second synchronous destination.
- The bridge period is kept as short as the Logos CRM milestones allow. Every week of
  bridge is another week of data that has to be imported from Notion.

## 3. Input contracts

### 3.1 CiviCRM dump (one-time)

UTF-8 CSV per entity with APIv4 paths as headers, or a SQL-level database dump.
PapaParse handles parsing and parser diagnostics; mapped rows are validated with
`drizzle-zod` schemas derived from the Drizzle tables and refined for migration-only
rules. Default limits are 25 MB and 50,000 rows per file. Source system code:
`civicrm`.

The entity list, exact field paths, format requirements, and pre-shutdown verification
steps are in [`civicrm-export-checklist.md`](civicrm-export-checklist.md).

### 3.2 Notion bridge (recurring during the bridge period)

Read through the Notion API rather than a manual CSV export, so the import can be
re-run and reconciled. Source system code: `notion`; source ID is the Notion page ID;
source timestamp is the page `last_edited_time`.

The property contract is what the intake endpoint writes today
(`apps/civi-crm/src/lib/notion/build-notion-properties.ts`):

| Notion property                       | Maps to                                |
| ------------------------------------- | -------------------------------------- |
| Title                                 | person full name                       |
| `Email/Website`                       | contact method, type `email`           |
| `Phone or Social Handle`              | contact method, type `phone` or `chat` |
| `Mvmt Organization`                   | organisation link                      |
| `Mvmt Status`                         | case status (`New Lead` on intake)     |
| `Wants Newsletter`, `Wants Events`    | consent flags                          |
| `How did you first hear about Logos?` | case lead source                       |
| `Tech Vision`, `Activities Vision`    | case summary fields                    |
| Website URL properties                | organisation website                   |

Evaluation during the bridge period is free text in the page body - the
`Submission Evaluation`, `Call Evaluation`, `One Pager Evaluation` and `Other Notes`
sections of the evaluation template. Import these as activities on the case, not as
structured scores. There is no numeric scorecard in the bridge period: that structure
exists in the CiviCRM dump and, going forward, in Logos CRM.

Snapshot the Notion database schema (the property list and select options) at the
start of the bridge period. It is the import contract, and a renamed property silently
breaks the mapping.

## 4. Phases

### Inventory and mapping

Inventory both sources. For CiviCRM: contacts, organisations, cases, relationships,
activities, assignments, option values, and status history. For Notion: the property
list, select options, and the evaluation page template. Version every source-to-target
field mapping and give each its own source-system code.

### Rehearsal

Import a production-shaped but access-controlled copy of both sources into a
non-production Compose environment. Validate entity counts, relationship counts,
source IDs, status history, ownership, timestamps, Unicode, and personal-data handling.

### Reconciliation

Run the same import twice and require stable counts. Produce machine-readable and
human-readable differences for missing source IDs, mapping failures, duplicate
suggestions, invalid relationships, and changed source rows.

### Bridge refresh

Run with:

```sh
NOTION_TOKEN=... NOTION_INTAKE_DATABASE_ID=... \
  pnpm --filter logos-crm import:notion
```

Each run reports created, duplicate, and error counts, records row-level errors
in `crm_import_errors`, and stores the newest source timestamp it saw. The next
run starts from that watermark rather than re-reading the whole database.

While the bridge period lasts, re-import Notion pages changed since the previous
watermark. `source_updated_at` and the page ID prevent stale imports from overwriting
newer CRM edits. Conflicts are reported for manual resolution rather than resolved by
picking a winner.

### Intake cutover

This is a single switch, not a per-workflow sequence - after the CiviCRM shutdown there
is only one workflow left to move:

1. Implement the Logos CRM intake endpoint with an idempotent `submission_id`.
2. Run the final Notion bridge import and reconcile counts.
3. Point the public funnel at Logos CRM as the canonical write.
4. Demote Notion and n8n delivery to Graphile Worker follow-up jobs.
5. Compare submissions received immediately before and after the switch for gaps and
   duplicates.
6. Run authenticated smoke tests and observe the agreed error thresholds.

Rollback restores the previous funnel routing. It is only safe while no Logos CRM-only
writes have occurred that Notion cannot represent; after that, rollback requires an
explicit reverse-export.

### Retirement

After the observation period, stop the Notion intake writes, keep the Notion database
read-only for the retention period, and archive the CiviCRM dump under the retention
policy.

## 5. Merge and identity rules

Source IDs are authoritative for repeated imports, per source system: a CiviCRM contact
ID and a Notion page ID can both point at the same person, and both are retained on the
survivor. Email, telephone, normalised names, and domains produce duplicate suggestions
only. Confirmed merges preserve every source ID and relationship link on the survivor.
Imported rows targeting a merged duplicate resolve to the survivor.

Cross-source duplicates are expected and are the normal case: a person who applied
before the shutdown and again during the bridge period arrives twice, once per source.

## 6. Cutover gates

Intake can move to Logos CRM only when:

- required and optional field mappings are signed off for both sources;
- create/update/unchanged/conflict/error totals reconcile;
- the CiviCRM dump has been imported and its scorecard history is queryable;
- the Notion bridge import is repeatable with stable counts;
- consent flags (newsletter, events) survive the import and are enforced;
- owners map to active CRM users;
- backup, restore, and rollback procedures have been rehearsed;
- the funnel routing change is separately approved.

## 7. Current boundary

Until the intake cutover, the public funnel keeps posting to the endpoint in
`apps/civi-crm`, which writes to Notion. Logos CRM records come from approved imports
or explicit internal creation. Logos CRM does not write to Notion, and Notion does not
write to Logos CRM.
