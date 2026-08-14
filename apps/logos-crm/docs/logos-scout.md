# Logos Scout - Organisation Discovery

> Status: Phase 0 built, synthetic fixtures only
>
> Product boundary: organisation and project discovery
>
> Implementation home: `apps/logos-crm`

## 1. Purpose

Logos Scout helps partnership and business-development staff find organisations
and projects that may be relevant to Logos, understand why they were surfaced,
and decide whether they should become CRM prospects.

Scout is not a general people-search product or a clone of a commercial contact
database. Its advantage should come from Logos-specific discovery criteria,
source selection, and evidence rather than the volume of personal contact data
it can acquire.

The initial product question is:

> Which active organisations or projects appear relevant to a published Logos
> partnership theme, what public evidence supports that assessment, and should
> a human reviewer create or link a CRM organisation?

Phase 0 answers a narrower question first, because it is the one that decides
whether the rest is worth building: **do evidence and an explained assessment
actually help a reviewer decide?**

## 2. Product principles

1. **Organisation first.** Discovery and assessment subjects are organisations,
   projects, or public communities, not people.
2. **Evidence before score.** Every recorded fact and every band links to a
   reviewable source and records when it was observed.
3. **Facts and inference are distinct.** A source observation is not presented
   as a conclusion, and an AI-generated summary is never presented as a source.
4. **Human acceptance is the CRM boundary.** A candidate does not become a CRM
   organisation until an authorised reviewer accepts or links it.
5. **No ideology classifier.** Scout assesses observable professional and
   technical activity. It does not infer political opinions, philosophical
   beliefs, personality, or personal alignment with Logos.
6. **No automatic outreach.** Discovery does not enrol contacts, send messages,
   create delivery jobs, or treat the absence of suppression as permission.
7. **Self-hosted core.** PostgreSQL, Graphile Worker, the application, and the
   review workflow run in the existing Docker Compose topology. External sources
   are optional, individually approved adapters rather than hosting dependencies.
8. **Personal data is dropped at the boundary, not at review.** An adapter
   response is filtered to its source policy's permitted fields before anything
   is stored, and a subject that resolves to a natural person is discarded with
   only a reason kept. Review is the last defence against personal data, never
   the first: by the time a reviewer sees a record, the processing has already
   happened.

## 3. What is built

Phase 0 exists in `apps/logos-crm` and runs on synthetic fixtures.

| Built | Where |
| --- | --- |
| Four tables: candidates, evidence, assessments, reviews | `src/server/db/schema.ts` |
| Deterministic rubric producing bands and a gate | `src/server/scout-rubric.ts` |
| Queue, candidate detail, and review service | `src/server/scout-repository.ts` |
| Three routes under `/api/v1/scout/*` | `src/app/api/v1/scout/` |
| Inbox and candidate detail screens | `src/components/scout-inbox.tsx`, `src/components/scout-candidate-page.tsx` |
| Search, multi-select, and bulk decisions in the queue | `src/components/scout-inbox.tsx` |
| Mock discovery: a recorded run that draws from a built-in catalogue | `src/server/scout-discovery.ts` |
| Synthetic fixtures: six seeded, nine more a run can surface | `src/server/db/scout-fixtures.ts` |
| Rubric unit tests, boundary integration tests, browser tests | `src/server/scout-rubric.test.ts`, `src/server/__tests__/scout.integration.test.ts`, `e2e/scout-review.spec.ts` |

Deliberately absent, and absent as a safety property rather than as a backlog
item: source adapters, credentials, outbound network calls, discovery briefs,
worker tasks, and any code path that writes to a CRM table. Discovery exists
only in its synthetic mode, which reads a fixture file.

## 4. Users and jobs

### Partnership and business-development staff

- review discovered organisations and their evidence;
- compare candidates without opening every source manually;
- accept, watch, reject, or mark a candidate as insufficiently evidenced;
- later: create a new CRM organisation or link an accepted candidate.

### CRM coordinators

- see only accepted organisations in normal CRM directories and search;
- understand where accepted organisation facts came from;
- avoid duplicates when an intake submission later references the same domain.

### Administrators

- enable only approved source adapters;
- configure refresh and retention policies per source;
- review failed extraction, stale evidence, and source-policy violations;
- audit who decided what, and what evidence was available at that time.

## 5. Scope

### In scope now

- synthetic end-to-end review scenarios for product validation;
- candidate organisations, projects, and communities;
- organisation-level, field-level evidence with observation time, expiry,
  extractor version, and the quoted excerpt behind each value;
- deterministic, explainable assessments expressed as bands;
- human review with `accept`, `watch`, `reject`, and `needs_evidence` outcomes;
- append-only review history with an audit event per decision;
- searching the queue by candidate name, domain, and summary;
- selecting several candidates and deciding them together with one reason;
- **mock discovery**: a recorded run that draws the next few candidates from a
  built-in catalogue of invented organisations and contacts nothing.

### In scope later

- approved source adapters, one at a time;
- discovery briefs and runs;
- scheduled refresh and evidence expiry through Graphile Worker;
- exact-domain and approved external-identifier deduplication;
- linking an accepted candidate to an existing CRM organisation, and creating
  one in a single audited transaction.

### Mock discovery, and why it is here

A review queue that always holds the same rows cannot show what reviewing feels
like, and the loop the product is asking people to fund is "work arrives, you
decide, more arrives". `Find more` demonstrates that loop end to end without
pretending to be a crawler: it takes the next few organisations from a fixture
file, records a run, and says on screen that no external source was contacted.

It is shaped like the real thing on purpose. A run is recorded with who asked
for it, what it added, and how many subjects it discarded as natural persons,
because those are the questions a reviewer will ask of a real adapter, and a
demo that skips them teaches the wrong expectations.

### Explicit non-goals

- people search or candidate-person scoring;
- personal email, telephone, Discord, Telegram, or social-handle enrichment;
- probabilistic identity matching across personal profiles;
- inferring political opinions, philosophical beliefs, or personal ideology;
- scraping authenticated, paywalled, or access-controlled pages;
- bypassing robots, rate limits, or source terms;
- buying or importing third-party contact lists;
- message generation, sequence enrolment, or message delivery;
- automatically creating CRM cases, tasks, or activities from an assessment;
- automatically rejecting an organisation because of an assessment;
- a generic user-authored scraping or automation platform;
- reproducing the breadth of a commercial data marketplace.

People discovery and outreach require separate product, legal, privacy, source,
authentication, authorisation, and delivery decisions. Their future possibility
does not expand the scope of this plan.

## 6. Candidate boundary

A Scout candidate is not a CRM organisation. It lives in its own tables, and
the boundary is enforced by what does not exist rather than by a filter
somebody has to remember:

- `scout_candidates` has no foreign key to `crm_organisations`;
- no Scout module imports a CRM writer;
- `search-repository` and `directory-repository` select from
  `crm_organisations` with no status predicate at all, which is why a status
  column could never have kept candidates out of the workspace, and why
  separate tables are the only mechanism that works.

Candidate states:

```text
needs_review -> accepted
             -> watch
             -> rejected
             -> needs_evidence

watch, rejected, needs_evidence -> needs_review (a new decision)
quarantined (terminal, entered by the pipeline)
```

`quarantined` is set when the subject resolved to a natural person. It is
terminal and a reviewer may not overturn it: reopening it would mean asking
somebody to examine the personal data the quarantine exists to avoid keeping.
Nothing is stored for a quarantined candidate except its name, the fact that it
was seen, and the reason.

`accepted` is terminal for a candidate version. A later change of mind is a new
assessment and a new review rather than a quiet edit of a recorded decision.

**In Phase 0, accepting writes nothing to the CRM.** There is no accept
endpoint that creates an organisation, because that code does not exist yet.
The acceptance transaction described in section 12 is Phase 3 work.

## 7. Data subject requests reaching Scout

Scout stores no natural-person identifiers. That is the answer to access,
rectification, and erasure requests, and it is enforced rather than asserted:

- the evidence `field` column is an enum of organisation-level properties, with
  no field for a name, a role, an address, or a handle;
- two check constraints refuse any value or excerpt containing something shaped
  like an email address or a telephone number;
- a subject that resolves to a natural person is quarantined before extraction.

This matters because the CRM's privacy operations cannot help here:
`crm_privacy_requests.person_id` is `not null` and references `crm_people`, so a
request from somebody who exists only in Scout could not even be recorded
without creating a CRM person for them, which would be the opposite of what an
erasure request asks for.

If a future source makes personal data unavoidable, that is a change to this
section first: either the constraint holds and the source is refused, or the
privacy tables are widened to a subject that need not be a CRM person. It is
not a decision an adapter may take on its own.

## 8. Evidence and extraction

Each candidate fact is one or more evidence rows. Required metadata:

- the candidate and the field it applies to;
- the value;
- source URL, source type, and title;
- content hash;
- **the excerpt the value came from**, because a hash proves a page changed and
  cannot show what it said. Six months after a decision, "why did we accept
  this" has to survive the source being rewritten;
- extraction method (`deterministic`, `manual`, `ai_assisted`, `synthetic`);
- **extractor version**, identifying the model, prompt, and parser. A method
  alone cannot be reproduced once any of those change, and an unreproducible
  fact cannot be audited;
- certainty: `exact`, `derived`, or `ambiguous`;
- observation time, expiry, and supersession.

There is deliberately no numeric confidence. A number between zero and one is
read as a probability, nothing here is calibrated against anything, and the
scale would be a claim the product cannot support.

AI-assisted extraction may structure or summarise an approved source. It must
not invent missing values, browse outside the source allowlist, or cite itself.
The interface shows the extraction method and version next to every value, and
the excerpt rather than a generated paraphrase, so an extraction never reads as
a fact somebody checked.

## 9. Fit assessment

The assessment ranks review work. It does not make a partnership decision, and
it does not produce a total.

**Bands, not points.** Each dimension gets `strong`, `moderate`, `weak`, or
`unevidenced`, with the reason and the evidence behind it. A weighted total
invites comparison between candidates whose evidence has nothing in common, and
ends up standing in for the decision it is explicitly not.

| Dimension | Reads | Band from |
| --- | --- | --- |
| Technical relevance | What the organisation says it works on | `theme_match` |
| Current activity | Dated public output | `recent_release` |
| Open collaboration surface | Whether an outsider can participate | `public_repository`, `public_documentation`, `contribution_path` |
| Ecosystem adjacency | Verifiable structural relations | `ecosystem_relation` |

A field feeds exactly one dimension. Letting repository activity count for both
"is this current" and "is this relevant" would report one observation twice and
make a single source look like agreement between several.

`strong` needs an exact value from a live source; `moderate` accepts a derived
one, because reading a release date off a changelog is a different kind of
claim from an organisation stating its own purpose; `weak` means something was
found and is either ambiguous or old enough that nobody should rely on it.

**Ecosystem adjacency is structural, never ideological.** It records shared
standards bodies, shared funders, dependency relationships, and joint
programmes: things a third party publishes and anybody can check. It never
records similarity to Logos values, and it is the dimension to watch, because
it is where an alignment classifier would grow if one ever did.

**Evidence quality is a gate, not a dimension.** It is a judgement about our
data, not about the organisation, so adding it to a total would let a
well-documented irrelevant organisation outrank a sparsely documented perfect
one. The gate is:

- `conflicted`: two live sources disagree about a field. The conflicting field
  and both values are named, because a reviewer told only that "something
  conflicts" has to open every source to find out which.
- `insufficient`: fewer than two independent sources, or no dimension has live
  evidence.
- `sufficient`: enough to review.

The queue is ordered by what a reviewer can act on: conflicts first, then
candidates ready to decide, then the ones waiting on evidence, which are
research rather than a decision.

Prohibited inputs:

- inferred personal beliefs or politics;
- demographic or sensitive attributes;
- individual social-post sentiment;
- personal contact availability;
- protected or inferred identity characteristics;
- opaque vendor scores without source-level evidence.

## 10. Data model

### Built

`scout_candidates`, `scout_evidence`, `scout_assessments`, `scout_reviews`.
See `src/server/db/schema.ts` for the columns and the constraints that carry
the boundary. Three properties are worth stating here because they are design
decisions rather than schema detail:

- an assessment is never updated. A recalculation supersedes the previous row,
  so a review still points at exactly what its reviewer saw;
- reviews are append-only, and each one records the assessment it was taken
  against;
- there is no `accepted_organisation_id` column yet. Adding one is Phase 3, and
  adding it early would create the write path this phase is defined by not
  having.

### Planned, not built

`scout_source_policies`, `scout_discovery_briefs`, `scout_discovery_runs`, and
`scout_candidate_identities`. These belong with the first real adapter. Fixing
their shape before the legal and source decisions land would freeze guesses
into a migration.

### Identity versus provenance

When acceptance is built, `crm_external_identities` records that an accepted
CRM organisation came from a Scout source. It is one row per (source, entity)
and must never hold fact-level provenance, which is one row per observation and
lives in `scout_evidence`.

Two hazards to design around before writing that code:

- the table's unique index is `(source_system, entity_type, source_id)`, so
  acceptance must be idempotent on the source identifier: if an identity
  already exists, link to the existing organisation rather than creating a
  second one;
- `merge-repository` reassigns external identities with a raw `update` and sets
  the merged organisation to `inactive`. Two organisations accepted from the
  same Scout source would make that update violate the unique index and fail
  the whole merge, and an accepted-candidate link would still point at the
  inactive record. Acceptance must therefore follow merges, and the merge
  update needs a conflict clause.

## 11. Worker and service design

Phase 0 has **no worker tasks**. Assessment is calculated in the request that
needs it, and mock discovery runs inline too: reading a fixture array takes
milliseconds, and queueing it would add a moving part that teaches nothing. The
first real adapter is the point at which discovery has to become a job, because
that is the point at which it can be slow, fail, and need a retry.

When real sources arrive:

- Scout runs as a **separate worker process** using the same image and a
  different task list. The current runner has `concurrency: 4` and also carries
  email notifications and task reminders; a slow external fetch would otherwise
  hold those slots and make a mention notification arrive hours late;
- expiry requires a **successful refresh that failed to reconfirm**, never the
  passage of time alone. A source outage means "we could not check", not "this
  is no longer true", and time-based expiry would re-open every review in the
  queue during a week-long outage and then quietly expire the candidates
  nobody got to;
- each task states its idempotency key. Evidence is keyed on candidate, field,
  source, and content hash, so a retry updates rather than duplicates;
- a run checkpoints per candidate and can be cancelled cooperatively. Graphile
  Worker cannot cancel a running job, so a run status that implies otherwise
  would be a lie;
- "no Scout task writes to people, cases, activities, or tasks" is enforced by
  a **PostgreSQL role without those privileges**, not by a code convention.
  Every task shares one `db` module, so a comment cannot enforce it.

## 12. API and permissions

Built:

- `GET /api/v1/scout/candidates` (filters: `state`, `entity_type`, `q`)
- `GET /api/v1/scout/candidates/:id`
- `POST /api/v1/scout/candidates/:id/reviews`
- `POST /api/v1/scout/reviews` (several candidates, one decision, one reason)
- `GET|POST /api/v1/scout/discovery-runs` (synthetic mode only)

Planned with the phases that need them: `/briefs`, `/briefs/:id/runs`,
`/runs/:id`, `/candidates/:id/accept`, `/candidates/:id/link`.

Capabilities will be `scout:read`, `scout:run`, `scout:review`, `scout:accept`,
and `scout:admin_sources`, with source administration, run approval, review,
and CRM acceptance deliberately separate.

**That enforcement layer does not exist yet.** `backend.md` and
`architecture.md` describe server-authored CASL abilities; there is no ability
code in `src/`, and every resolved actor can currently do everything
(`open-questions.md` section 1). Scout endpoints therefore carry no capability
checks today, which is safe only because the only things they can reach are
synthetic fixtures and a decision column. Real source runs and CRM acceptance
must not be built before abilities exist.

Record scope is also unresolved: `architecture.md` scopes CRM records by team,
and Scout candidates have no owning team. Until that is decided, all Scout data
is readable by anybody who can reach the app.

## 13. User interface

### Scout inbox

- filters by review state;
- a search field matching name, domain, and summary. It deliberately does not
  search evidence: evidence text is where a free-text query would start
  returning people named in a source;
- checkboxes and a bulk bar for deciding several candidates with one reason.
  Accepting is absent from it on purpose, because taking a candidate forward is
  a per-candidate judgement and a bulk accept is how a queue becomes a list
  nobody read;
- `Find more`, which runs synthetic discovery and reports what it added;
- one row per candidate with entity type, canonical domain, and summary;
- the gate as a badge, worded as a statement about the evidence;
- the four bands with their values;
- ordered by what can be acted on, never by a score.

### Candidate detail

- identity and canonical domain;
- the gate, its reason, and every band with the reason behind it;
- conflicting fields with both values;
- every evidence item: value, quoted excerpt, source link, extraction method
  and version, certainty, observation date, and expiry;
- provenance summary: first seen, last observed, evidence count, distinct
  sources;
- append-only review history with the reviewer and reason.

### Review action

- accept, watch, reject, or request more evidence;
- a reason is required for every decision, not only acceptance: a rejection
  without one is the candidate that gets rediscovered and rejected again by
  somebody who cannot see why;
- the panel states plainly that a decision creates no CRM record;
- no person search, contact button, message draft, or sequence action.

## 14. Delivery phases

### Phase 0 - synthetic product validation (done)

Inbox, candidate detail, evidence, assessment, and review over synthetic
fixtures. No external calls, no CRM writes.

### Phase 0.5 - deployment isolation (open)

Phase 0 currently runs in the same deployment and the same database as the CRM
demo, which is reachable without a login in `AUTH_MODE=demo`. That is
acceptable only while Scout writes nothing and holds nothing real. Before any
adapter work:

- decide whether Scout gets a separate database or a separate Postgres schema;
- decide whether Scout routes mount at all when `AUTH_MODE=demo`.

### Phase 1 - source-policy and legal decisions

- approve the organisation-level purpose and retention policy;
- decide whether a DPIA screening or a full DPIA is required;
- approve the first source, its terms, fields, refresh, and retention rules;
- define how sole traders, informal communities, and person-named projects are
  detected, and confirm the quarantine happens before extraction;
- implement production identity and `scout:*` server-side abilities.

### Phase 2 - one real source adapter

- enable a single low-risk, organisation-controlled source, run manually like
  the Notion bridge import rather than on a schedule;
- add the fetch wrapper, permitted-field filter, quarantine path, and per-source
  rate limit;
- add `scout_source_policies` and `scout_candidate_identities`;
- measure precision, duplicate rate, reviewer time, and source failures.

### Phase 3 - acceptance and refresh

- add reviewed CRM creation and linking, with the idempotency and merge rules
  in section 10;
- add scheduled refresh and confirmation-based expiry in a separate worker;
- add source-health and review-quality reporting;
- expand sources only when the preceding one has an accountable owner and
  acceptable precision.

## 15. Source policy

The first approved source set should be narrow and organisation-controlled:
official sites, official feeds, public repository metadata, public technical
documentation, public grant or programme directories.

**These are organisation-controlled, not personal-data-free.** Repository
metadata carries contributor logins and commit author addresses; feeds carry
author names; grant directories carry principal investigators. Each policy
record must therefore list the personal-data fields its source can return and
state that they are dropped, not stored.

Every adapter has a policy record containing source owner and type, access
method, permitted fields, terms and robots review date, rate limit and refresh
interval, extracted-evidence retention, whether AI-assisted extraction is
permitted, the approving owner, and the date the approval must be reviewed.

Raw responses are **not stored** in Phase 2. If that changes, the table and its
retention period belong in section 10 before the adapter is written.

An adapter is disabled by default, and a credential must not enable it. Three
things are needed, and none of them is a secret:

1. an active source-policy record;
2. a server-side allowlist entry;
3. an outbound fetch that goes through a single wrapper taking the source
   policy as an argument and refusing any host outside it.

Adapter credentials are worker-only environment variables. The app already
makes outbound calls from a request path (`captcha.ts`) and from a script
(`notion-client.ts`), so "the code will not call it" is not a control.

## 16. Success measures

The MVP is successful when it improves review quality and research time, not
when it maximises the number of scraped candidates.

- precision of surfaced organisations after human review;
- percentage of facts with current, directly reviewable evidence;
- median reviewer time per candidate;
- duplicate rate against existing CRM organisations;
- percentage of assessments with missing or conflicting evidence correctly
  exposed;
- acceptance, watch, rejection, and needs-evidence rates;
- source failure and evidence-expiry rates;
- zero people, personal contact methods, or CRM records created by Scout.

## 17. Acceptance criteria for Phase 0

All of these hold today and are covered by tests:

- only synthetic organisation and project fixtures exist, on `.example` domains
  that cannot be registered;
- every displayed value carries its source, excerpt, extraction method,
  extractor version, and certainty, and no numeric confidence pretends to
  represent real-world truth;
- a deterministic rubric produces bands and a gate with a stated reason, and no
  total;
- a reviewer can accept, watch, reject, or request evidence, with a reason;
- accepting creates nothing in the CRM, proved by asserting that
  `crm_organisations`, `crm_people`, `crm_cases`, and `crm_tasks` are still
  empty after an acceptance;
- candidates never appear in CRM search, directories, or exports;
- the database refuses evidence containing an email address or a telephone
  number;
- a quarantined candidate cannot be reviewed and has no evidence;
- the UI contains no person-search, contact-enrichment, send, sequence, or
  outreach action;
- source adapters, external credentials, and external network calls are absent.

## 18. Decisions required before real discovery

Section 12 of [`open-questions.md`](open-questions.md) still owns the
enrichment question. Before Phase 2, owners must decide:

1. the exact partnership purpose and lawful basis, recorded as a
   legitimate-interest assessment attached to the source-policy version;
2. whether DPIA screening or a full DPIA is required. Systematic monitoring of
   publicly accessible sources and evaluation of subjects are two of the
   screening criteria, so a screening should be assumed necessary until legal
   advice says otherwise;
3. the first approved source and its terms;
4. the controller, source-policy owner, and review owner;
5. retention for rejected candidates, quarantined subjects, and expired
   evidence. Phase 0 has no retention rule at all, which is acceptable only
   because the fixtures are invented;
6. whether Scout may ever hold a natural-person identifier, and if so how
   access, rectification, and erasure requests are received and satisfied
   (section 7);
7. the published Logos themes and the owner of each rubric version;
8. the minimum evidence needed before a candidate may be accepted into the CRM;
9. whether AI-assisted extraction may send source content outside
   Logos-controlled infrastructure, and how the extractor version is recorded
   when it does;
10. the precision threshold that justifies adding another source;
11. the deployment isolation in Phase 0.5;
12. whether the queue keeps working without a total, or whether reviewers ask
    for one. If they do, the answer is more evidence dimensions, not a weighted
    sum.

Until these are recorded, Logos Scout remains a synthetic product prototype
rather than a real organisation-discovery pipeline.
