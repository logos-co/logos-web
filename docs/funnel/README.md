# Intake funnel — Notion CRM database

Operational and design notes for routing the three public connect intake forms into the **IFT BD CRM -- funnel test** Notion database, with CiviCRM as a backup store.

## Goals

1. **Single CRM row per submission** — Coalition Partner, Activist Builder, and Activist Leader / Steward submissions land in one Notion database so Movement BD can triage leads in one place.
2. **Reuse the existing funnel DB** — Map form fields onto properties that already exist on the database where possible; add only the columns the forms need that are missing.
3. **Dual write, one captcha** — All three forms post to one `civi-crm` API route. hCaptcha tokens are single-use, so Notion (primary) and CiviCRM (backup) writes must happen in the same handler after one verification.
4. **Decoupled integrations** — Notion and CiviCRM live in separate modules under `apps/civi-crm/src/lib/`; a thin route orchestrates them so either backend can be removed without touching the other.

## Implementation status

| Step | Goal (short) | Status |
| --- | --- | --- |
| 1. Schema | Nine intake columns on funnel data source | Done |
| 2. Visibility | Hide when empty on new columns (Notion UI) | Manual — [checklist](./notion-database.md#manual-checklist-required) |
| 3. Notion lib | Map payloads → funnel properties; `submitToNotion` | Done — [details](./implementation.md#3-notion-lib-appscivi-crmsrclibnotion) |
| 4. CiviCRM lib | `submitToCiviCrm` without Notion imports | Partial |
| 5. Orchestrator | One captcha; Notion required; Civi backup | Pending |
| 6. Web pages | All three → `afform-submit` | Partial |
| 7. Cleanup | Remove `notion-coalition-partner`; update civi-crm docs | Pending |

Full goals, what changed, and acceptance criteria: [implementation.md](./implementation.md).

## Web pages and API

| Page | Route | `formName` (POST body) |
| --- | --- | --- |
| Coalition Partner | `/coalition-partner` | `afformCoalitionPartner` |
| Activist Builder | `/activist-builder` | `afformActivistBuilder` |
| Activist Leader / Steward | `/activist-leader-steward` | `afformActivistLeaderSteward` |

| Concern | Value |
| --- | --- |
| Target endpoint (all three) | `POST /api/public/afform-submit` on `apps/civi-crm` |
| Coalition Partner today | `POST /api/public/notion-coalition-partner` (Notion only; to be removed) |
| Activist forms today | `POST /api/public/afform-submit` (CiviCRM only) |
| Notion database (UI) | [IFT BD CRM -- funnel test](https://www.notion.so/ede0c08525554244b940f681318a0891) |
| Notion data source ID | `5919873c-d7b1-42ff-acdf-380b62a4176c` (`collection://5919873c-d7b1-42ff-acdf-380b62a4176c`) |
| Env vars | `NOTION_API_TOKEN`, `NOTION_COALITION_PARTNER_DB_ID` (see `apps/civi-crm/.env.example`) |

## Documentation in this folder

| Document | Contents |
| --- | --- |
| [notion-database.md](./notion-database.md) | Property mapping, schema DDL, visibility limits, manual UI checklist |
| [implementation.md](./implementation.md) | Phased steps, code layout, done vs pending |

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
- **Joined multi-values** — Multiple websites → `Website` (pipe-separated); multiple chat handles → `Phone or Social Handle` (`handle (service)` per entry, joined).
- **`Organization` select** — Case-insensitive match against existing options at submit time; unmatched values are written as-is and Notion creates a new option.
- **Env naming** — Keep `NOTION_COALITION_PARTNER_DB_ID` and `/api/public/afform-submit` to avoid deploy churn across environments.

## Related repo docs

- [docs/civi-crm/architecture.md](../civi-crm/architecture.md) — `civi-crm` app structure (update when orchestrator lands)
- [docs/deployment.md](../deployment.md) — env vars and deploy targets for `apps/civi-crm`
