# Logos CRM - Open Questions

Decisions the implementation has deliberately deferred. Each entry says what was
assumed in the meantime, so nothing is silently guessed: where the code had to
pick something to keep moving, the placeholder is named and the cost of changing
it later is stated.

Ordered by how expensive the decision gets if it arrives late.

---

## 1. Authentication and access control

**Question.** What identity contract does Infra provide - header names, the
shared verification secret, and what an unknown-but-valid subject should mean?

**Assumed.** `AUTH_MODE=none`: the acting user is resolved server-side from
`CRM_DEV_ACTOR_EMAIL`, the browser cannot influence it, and the app refuses to
serve production requests. `AUTH_MODE=proxy` throws rather than admitting
everyone. `AUTH_MODE=demo` is the one way to serve a production build without an
identity, and it is a claim about the data rather than a relaxation of the rule:
seeded fixtures only, no real person's details, and a label on every screen. The
deployed previews run on it so reviewers can see the working interface.

**Cost of delay.** Low for now, high once real data lands. Everything already
takes an `ActorContext`, so wiring identity is one file - but until it is wired,
an instance holding real personal data must sit behind Infra or VPN access
control. Running without a login screen is not the same as running without
access control.

**Also undecided.** Role model and record scoping (CASL). Today every resolved
actor can see everything.

---

## 2. Public intake spam protection

**Question.** Which hCaptcha secret does this deployment use, and who
provisions it? Does Infra still own rate limiting for this route?

**Built.** `POST /api/public/intake` verifies an hCaptcha token before anything
is written, matching what the endpoint it replaces did. With no
`HCAPTCHA_SECRET` configured the check is skipped so local development and tests
do not need one, and production refuses to start without it - an open endpoint
that looks protected is worse than one that is visibly open. A verifier outage
returns 503 rather than 403, because an outage is not a rejected human.

**Still open.** The secret itself. Nothing else here blocks cutover, but the
route is only actually protected once Infra provides it, and the architecture
spec puts rate limiting on Infra's side - worth confirming that still holds for
a route the internet can reach.

---

## 3. CiviCRM final export

**Question.** Who runs the export, when, and where is it stored?

**Assumed.** Nobody has done it yet. [`civicrm-export-checklist.md`](civicrm-export-checklist.md)
lists the exact APIv4 paths.

**Cost of delay.** Irreversible. logos-co/logos-web#134 has merged, so no code
path in this repo can reach a CiviCRM instance any more. The six-criterion
scorecard, coordinator relationships, and status history exist only inside the
running instances. Once they are switched off, "why did we approve this partner
in 2025" has no answer.

---

## 4. Evaluation criteria

**Question.** What are the real stages, the scale, and who reviews? Is a single
reviewer per stage right, or does intake review need several with recorded
disagreement?

**Assumed.** Four stages mirroring the Notion evaluation template - Submission,
Call, One pager, Other notes - each with an optional 1–5 score and notes, one
reviewer per stage, rubric version `intake-v1`. The average is taken over scored
stages only, so an unscored stage is a gap rather than a zero.

**Cost of delay.** Low. `criteria_version` is stored on every row, so a new
rubric does not rewrite the meaning of past scores. Multiple reviewers would
need quorum, re-review, and disagreement rules, which is why they were left out
rather than invented.

**Note.** This is not equivalence with the old CiviCRM scorecard - that was six
weighted criteria and it is gone. Treat these four stages as a starting point to
argue with, not a migration of the old rubric.

---

## 5. Notion bridge

**Question.** Which Notion integration token and database id does this
deployment use, who runs the import, and how often?

**Built.** `pnpm --filter logos-crm import:notion` imports the bridge period
through the Notion API. Pages become records through the same pipeline the
public funnel uses, keyed on the page id so a re-run updates nothing, and the
history it writes is marked imported so those cases stay out of duration
metrics. Each run records its counts and row-level errors, and the newest source
timestamp becomes the next run's starting point.

**Still open.** Credentials, and who runs it. A renamed Notion property still
breaks the mapping silently - the property names live in
`src/contracts/notion.ts`, so snapshot the database schema and treat a rename
there as a code change.

**Cost of delay.** Lower than it was, but still growing: every week of bridge is
another week of applicants nobody has imported yet.

---

## 6. Decision and status semantics

**Question.** Should the decision drive the case status? Today a case can be
`approved` and still `in_progress`, which may be correct - approval starts
onboarding - or may be two fields disagreeing.

**Assumed.** Decision and status are independent. `closed` is terminal, and
reopening is a separate audited action rather than a status edit.

**Cost of delay.** Low, but reports depend on it. "Approved this quarter" has to
mean one of the two, and the reporting work will force the answer.

---

## 7. Working thresholds

Numbers currently chosen by the implementation. Each is a named constant, so
changing them is a one-line edit - but they are team agreements, not
implementation details.

| Threshold                     | Value    | Where                      |
| ----------------------------- | -------- | -------------------------- |
| Case is stale without contact | 14 days  | `STALE_AFTER_DAYS`         |
| Intake triage task due        | 48 hours | `TRIAGE_DUE_HOURS`         |
| Score range                   | 1–5      | `EVALUATION_SCORE_MIN/MAX` |

**Cost of delay.** None structurally. They do change which cases people are
asked to chase, so they should be confirmed by whoever owns follow-up.

---

## 8. Retention and personal data operations

**Question.** Are 30 days the right retention for a raw intake payload? What is
the audit-event retention? Who signs off an erasure before it is applied?

**Built.** Do-not-contact on a person, which suppresses their contact methods
while keeping the address so a later submission is still recognised as the same
person. Access, rectification, erasure, and objection requests are tracked as
work with a status, because the obligation is to answer within a deadline and an
untracked request is one nobody can prove was answered. Erasure removes the name
and contact details and clears the stored submission, while cases, links, and
the audit trail stay so what was decided remains provable. A nightly job expires
processed intake payloads after `INTAKE_PAYLOAD_RETENTION_DAYS`.

**Still open.** The retention numbers themselves, audit-event retention, and
whether erasure needs a second approver. Response drafts already refuse to
render for a suppressed applicant, so nothing offers to contact somebody who
asked us not to.

---

## 9. Ecodev case type

**Question.** The stage and substatus catalogue, the valid pairs, and the
allowed transitions (status-web#1176).

**Assumed.** Not built. Cases carry a free-text `stage`.

**Cost of delay.** Moderate. The typed subtype table and its catalogue are
specified in `data-model.md`; building them against an unconfirmed catalogue
would mean rebuilding them.

---

## 10. Notifications

**Question.** Who owns the Discord bot, which channels may it post to, and is
Discord in scope for v1 at all?

**Assumed.** Not built. Graphile Worker is not running yet, so `@mention`
notification, task reminders, and delivery records do not exist.

**Cost of delay.** Low. The worker is additive.

---

## 11. Reporting

**Question.** Is XLSX genuinely required by leadership, or is filtered CSV
enough (status-web#1178)? Who signs off the metric definitions - cohort, `as_of`,
timezone, and how imported cases without trustworthy history are reported?

**Assumed.** Not built.

**Cost of delay.** Low now, but the metric contract must be fixed before any
chart ships, or a chart and its export will disagree.

---

## 12. Enrichment and ICP scoring

**Question.** Any paid vendor, or organisation-level public sources only? What
is the lawful basis, and is a DPIA needed?

**Assumed.** Not built, and deliberately last. Organisation-level facts and
deterministic matching on identifiers the applicant supplied are the low-risk
starting point; personal-data enrichment and scoring are not.

**Cost of delay.** None. This should stay last.

---

## 13. Intake cutover

**Question.** Who flips the public funnel to Logos CRM, what is the rollback
window, and does Notion/n8n delivery continue as a worker follow-up afterwards?

**Assumed.** The sequence is in [`migration.md`](migration.md). Nothing is
scheduled.

**Cost of delay.** Ties to items 2, 3, and 5: the captcha, the CiviCRM dump, and
the Notion bridge import all gate it.
