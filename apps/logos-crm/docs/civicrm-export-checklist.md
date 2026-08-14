# CiviCRM - Final Export Checklist

> Status: required before the CiviCRM instances are switched off.
>
> Owner: whoever holds CiviCRM administrative access.

## 1. Why this is urgent

[logos-co/logos-web#134](https://github.com/logos-co/logos-web/pull/134) removes the
entire CiviCRM query layer from this monorepo. Once it merges, no code path in the
repository can read a CiviCRM instance, and `apps/civi-crm` keeps only the public
funnel intake endpoint. Everything below therefore has to be exported from the
running instance itself - through the CiviCRM admin UI, APIv4, or a database dump -
not through this repository.

The evaluation data in particular has no successor. The six-criterion scorecard is a
set of CiviCRM case custom fields; after the shutdown, intake evaluation continues as
free-text sections in a Notion page body
(`Submission Evaluation`, `Call Evaluation`, `One Pager Evaluation`, `Other Notes`).
If the scores are not exported, the answer to "why was this partner approved in 2025"
is permanently lost.

Do this before the instance is decommissioned. It does not depend on Logos CRM being
ready, and it must not be scheduled after it.

## 2. Export scope

Export every row, not a filtered view, and preserve the CiviCRM primary key of each
record. Logos CRM imports upsert on `(source_system, source_id)`, so a row without its
original ID cannot be reconciled or re-imported safely.

### 2.1 Cases

Case type `circles_onboarding` is the onboarding pipeline the coordinators work in.
Export all case types present in the instance, not only this one.

| Data               | CiviCRM APIv4 path                     |
| ------------------ | -------------------------------------- |
| Case ID            | `id`                                   |
| Subject            | `subject`                              |
| Case type          | `case_type_id:name`                    |
| Status             | `status_id:name` and `status_id:label` |
| Created / modified | `created_date`, `modified_date`        |
| Lead source        | `Circle_Case.Lead_Source:name`         |
| Profile            | `Circle_Case.Profile:name`             |
| Notes              | `Circle_Case.Notes`                    |
| Client contact     | `contact_id`                           |

### 2.2 Scorecard (highest priority - no successor system)

All six scoring fields are integers 1–5, plus the stored average.

| Criterion                             | CiviCRM APIv4 path                                |
| ------------------------------------- | ------------------------------------------------- |
| Mission / values alignment            | `Circle_Case.Mission_Values_Alignment`            |
| Commitment / reliability              | `Circle_Case.Commitment_Reliability`              |
| Facilitation / distributed leadership | `Circle_Case.Facilitation_Distributed_Leadership` |
| Execution ability                     | `Circle_Case.Execution_Ability`                   |
| Relevant skills / experience          | `Circle_Case.Relevant_Skills_Experience`          |
| Overall fit                           | `Circle_Case.Overall_Fit`                         |
| Stored average                        | `Circle_Case.Scorecard`                           |

Export the stored average as well as the six components. It is the value coordinators
actually saw, and recomputing it later from partially null components would silently
change historical records.

### 2.3 Coordinator assignment

Coordinator assignment is a CiviCRM `Relationship`, not a case field, so a case-only
export loses it. Export the `Relationship` entity with:

- relationship ID, relationship type, case ID, both contact IDs;
- `is_active`, `start_date`, `end_date`.

The start/end dates are the only record of who owned a case at a past point in time.
Logos CRM stores this in `crm_case_assignments` with `valid_from` / `valid_to`.

### 2.4 Contacts and organisations

| Data                  | CiviCRM APIv4 path                        |
| --------------------- | ----------------------------------------- |
| Contact ID            | `id`                                      |
| Contact type          | `contact_type`                            |
| Display name          | `display_name`                            |
| Primary email         | `email_primary`                           |
| City                  | `address_primary.city`                    |
| Country               | `address_primary.country_id:label`        |
| Skills / experience   | `Skills_Socials.Skills_Experience`        |
| Wants event info      | `Skills_Socials.Informed_About_Events`    |
| Newsletter subscriber | `Skills_Socials.Subscribed_To_Newsletter` |

The two subscription flags are consent records. Export them explicitly: they decide
whether Logos CRM may contact a person at all, and a lost opt-out is a compliance
problem, not a missing nice-to-have.

### 2.5 History and activity

- Case status change history, with the timestamp and the acting user of each change.
- The `Activity` entity for every case: type, subject, body, `activity_date_time`,
  source/target/assignee contacts.
- Case tags, groups, and group memberships.

Status history is what makes stage duration and pipeline reporting possible. If the
instance cannot produce per-change history, record that explicitly - imported cases
without trustworthy history are counted in current totals but excluded from
transition-duration metrics, and the coverage gap has to be reported rather than
silently averaged over.

### 2.6 Option lists

Export the option values behind every `:name` / `:label` pair above - case status,
lead source, profile, relationship types, country. Logos CRM catalogues are versioned
by effective time, so the historical label of a code has to be importable.

## 3. Format requirements

- UTF-8, one file per entity, with a header row naming the APIv4 path.
- Timestamps in UTC with an explicit offset. A local-time export without an offset
  cannot be reconciled against Notion submissions.
- Keep `:name` values, not only `:label`. Labels are display text and get edited;
  names are the stable codes.
- No filtering, no de-duplication, no manual spreadsheet edits. Import de-duplication
  happens in Logos CRM, where it is reviewable and reversible.
- A SQL-level dump of the CiviCRM database, if obtainable, is a strictly better
  artefact than any APIv4 export and should be taken in addition to the CSVs.

## 4. Verification before shutdown

1. Export twice, a few minutes apart, and compare row counts per entity.
2. Confirm every case row has a client contact ID that exists in the contact export.
3. Confirm the number of coordinator relationships is non-zero and matches the number
   of cases showing an assigned coordinator in the UI.
4. Spot-check five cases with a non-null `Circle_Case.Scorecard` against the six
   component fields.
5. Record the export timestamp - it is the watermark that separates CiviCRM-era data
   from the Notion bridge period described in [`migration.md`](migration.md).

## 5. Handling

The export is a complete copy of personal data: names, emails, addresses, and
free-text evaluations of identifiable people.

- Store it in the protected volume or an equivalent access-controlled location,
  not in a shared drive, a ticket attachment, or this repository.
- Restrict access to the people performing the import.
- Record what was exported, when, by whom, and where it is stored.
- Delete the working copies once the import is reconciled and the data lives in
  Logos CRM under its retention policy.
