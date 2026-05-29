# Intake funnel — Notion CRM database

Operational and design notes for routing the three public connect intake forms into the **IFT BD CRM -- funnel test** Notion database, with CiviCRM as a backup store.

## Goals

1. **Single CRM row per submission** — Coalition Partner, Activist Builder, and Activist Leader / Steward submissions land in one Notion database so Movement BD can triage leads in one place.
2. **Reuse the existing funnel DB** — Map form fields onto properties that already exist on the database where possible; add only the columns the forms need that are missing.
3. **Dual write, one captcha** — All three forms post to one `civi-crm` API route. hCaptcha tokens are single-use, so Notion (primary) and CiviCRM (backup) writes must happen in the same handler after one verification.
4. **Decoupled integrations** — Notion and CiviCRM live in separate modules under `apps/civi-crm/src/lib/`; a thin route orchestrates them so either backend can be removed without touching the other.

## Web pages and API (target state)

| Page | Route | `formName` (API) |
| --- | --- | --- |
| Coalition Partner | `/coalition-partner` | `coalition_partner` |
| Activist Builder | `/activist-builder` | `activist_builder` |
| Activist Leader / Steward | `/activist-leader-steward` | `activist_leader_steward` |

| Concern | Value |
| --- | --- |
| Orchestrator endpoint | `POST /api/public/afform-submit` on `apps/civi-crm` |
| Notion database (UI) | [IFT BD CRM -- funnel test](https://www.notion.so/ede0c08525554244b940f681318a0891) |
| Notion data source ID | `5919873c-d7b1-42ff-acdf-380b62a4176c` (`collection://5919873c-d7b1-42ff-acdf-380b62a4176c`) |
| Env vars | `NOTION_API_TOKEN`, `NOTION_COALITION_PARTNER_DB_ID` (see `apps/civi-crm/.env.example`) |

Today (pre-refactor): only coalition-partner uses Notion via `/api/public/notion-coalition-partner`; activist forms use `afform-submit` (CiviCRM only). The code refactor described in [notion-database.md](./notion-database.md#implementation-roadmap) unifies all three on the orchestrator.

## Documentation in this folder

| Document | Contents |
| --- | --- |
| [notion-database.md](./notion-database.md) | Property mapping, schema DDL (completed), visibility limits, manual UI checklist |

## Shared form fields

All three forms submit:

`name`, `city`, `country`, `skills`, `email`, `affiliatedOrgs`, `website[]`, `chat[]` / `chatService[]`, `questions`, `wantsEvents`, `wantsNewsletter`

Form-specific textareas:

| Form | Extra fields | Notion column(s) |
| --- | --- | --- |
| Coalition Partner | `backgroundPartner` | `Background` |
| Activist Builder | `backgroundBuilder`, `techVision` | `Background`, `Tech Vision` |
| Activist Leader / Steward | `backgroundLeader`, `activitiesVision` | `Background`, `Activities Vision` |

## Design decisions

- **One `Background` column** — All `background*` textareas map to a single rich-text property; vision questions stay on `Tech Vision` and `Activities Vision`.
- **Joined multi-values** — Multiple websites → `Website` (joined with ` | `); multiple chat handles → `Phone or Social Handle` (joined as `handle (service)`).
- **`Organization` select** — Case-insensitive match against existing options at submit time; unmatched values are written as-is and Notion creates a new option.
- **Env naming** — Keep `NOTION_COALITION_PARTNER_DB_ID` and `/api/public/afform-submit` to avoid deploy churn across environments.

## Related repo docs

- [docs/civi-crm/architecture.md](../civi-crm/architecture.md) — `civi-crm` app structure (update when the orchestrator and `src/lib/notion/` land)
- [docs/deployment.md](../deployment.md) — env vars and deploy targets for `apps/civi-crm`
