# Funnel intake -- architecture reference

Target audience: AI agents reading this codebase.

## What this is

Three public funnel forms (Coalition Partner, Activist Builder, Activist Leader / Steward) post to a single API endpoint on `apps/civi-crm`. They write to Notion (required) and CiviCRM (backup, best-effort).

**`/connect` is now `/contact`, and its form content was removed because it is no longer used.** The route at `apps/web/app/[locale]/contact/page.tsx` now redirects to the home page. The `afformCircleContactForm` `formName` is still accepted by the endpoint (CiviCRM-only path, see below), but nothing in `apps/web` posts it anymore.

---

## Request flow

```
apps/web (static)
  └── connect-form-section.tsx
        │  POST { formName, captchaToken, fields[], ...formFields }
        ▼
apps/civi-crm
  POST /api/public/afform-submit
  ├── 1. validate body, formName (must be one of four allowed values), fields[]
  ├── 2. verify hCaptcha (once, single-use token -- cannot verify twice)
  ├── 3. read env flags (FUNNEL_INTAKE_NOTION_DISABLED / FUNNEL_INTAKE_CIVICRM_DISABLED)
  ├── 4. submitToNotion(formData, formName)   -- only for Coalition/Builder/Leader; required there (failure → 502)
  └── 5. submitToCiviCrm(formData, fields, formName)  -- required for `afformCircleContactForm` (legacy /connect, now /contact); best-effort when Notion is enabled
```

The reason both writes are in one handler: hCaptcha tokens are single-use. One POST, one token, two backend writes in sequence.

---

## Code layout

| Path | Role |
| --- | --- |
| `apps/civi-crm/src/app/api/public/afform-submit/route.ts` | Orchestrator: validation, captcha, calls both libs |
| `apps/civi-crm/src/lib/intake-submit-flags.ts` | Reads `FUNNEL_INTAKE_*_DISABLED` env flags |
| `apps/civi-crm/src/lib/notion/maps.ts` | `SKILLS_MAP`, `CHAT_SERVICE_MAP`, `COUNTRY_MAP`, `PROFILE_BY_FORM`, `MVMT_STATUS_NEW_LEAD`, `BU_MOVEMENT` |
| `apps/civi-crm/src/lib/notion/build-notion-properties.ts` | `buildNotionProperties` + `resolveOrganizationSelect` |
| `apps/civi-crm/src/lib/notion/submit.ts` | `submitToNotion` -- GETs DB for org options, builds properties, POSTs page |
| `apps/civi-crm/src/lib/civicrm/submit-afform.ts` | `submitToCiviCrm` -- builds Afform values, POSTs to CiviCRM API |
| `apps/civi-crm/src/lib/civicrm/build-afform-values.ts` | `buildAfformValues` (shared) |
| `apps/civi-crm/src/lib/civicrm/afform-case-defaults.ts` | `AfformIntakeFormName` type + case defaults |
| `apps/civi-crm/src/lib/notion/__tests__/build-notion-properties.test.ts` | Property mapping unit tests |

The Notion and CiviCRM libs have **no cross-imports**. Removing one means deleting its folder and one call site in the orchestrator.

---

## Forms and `formName`

| Web page | `formName` in POST body | Notion `Profile` value |
| --- | --- | --- |
| `/contact` (was `/connect`) | `afformCircleContactForm` | _(none -- form content removed; route redirects to home, no longer submitted)_ |
| `/coalition-partner` | `afformCoalitionPartner` | `Coalition Partner` |
| `/activist-builder` | `afformActivistBuilder` | `Activist Builder` |
| `/activist-leader-steward` | `afformActivistLeaderSteward` | `Activist Leader / Steward` |

---

## Env variables

### Required when Notion intake is enabled (default)

| Variable | Purpose |
| --- | --- |
| `NOTION_API_TOKEN` | Notion integration secret |
| `NOTION_DB_ID` | ID of the Notion database |

### Required for live submissions (unchanged from pre-funnel)

| Variable | Purpose |
| --- | --- |
| `HCAPTCHA_SECRET` | Verify captcha tokens from `apps/web` |
| `CIVICRM_BASE_URL` | CiviCRM instance base URL |
| `CIVICRM_API_KEY` | CiviCRM API key |

### Optional opt-outs

| Variable | Effect when truthy (`1`, `true`, `yes`, `on`) |
| --- | --- |
| `FUNNEL_INTAKE_NOTION_DISABLED` | Skip Notion; CiviCRM becomes required |
| `FUNNEL_INTAKE_CIVICRM_DISABLED` | Skip CiviCRM; Notion only |

Default (no flags set): the `afformCircleContactForm` formName is CiviCRM-only (Notion skipped) -- a legacy path kept for the now-removed `/connect` (now `/contact`) form. The three active forms keep Notion required and CiviCRM best-effort.

---

## `submitToNotion` runtime behaviour

1. Read `NOTION_API_TOKEN` and `NOTION_DB_ID`; return `{ ok: false }` if either is missing.
2. `GET /v1/databases/{id}` to read current `Organization` select options.
3. `resolveOrganizationSelect(affiliatedOrgs, options)` -- lowercase compare; use canonical option name if matched, else use the submitted value (Notion auto-creates the option).
4. `buildNotionProperties(formData, formName, organizationSelect)` -- see field mapping below.
5. `POST /v1/pages` with `parent.database_id` and `properties`. Notion API version: `2026-03-11`.
6. Return `{ ok: true }` or `{ ok: false, message }`.

Empty optional properties (rich text, url, email, select) are omitted from the POST body so rows stay sparse.

---

## IFT BD CRM -- full database schema

The table below lists every property in the database as of 2026-05-29. The **Funnel** column marks whether the funnel intake writes to the property, and how.

| Property | Notion type | Funnel | Notes |
| --- | --- | --- | --- |
| `Name` | title | **yes -- reused** | From form `name`; fallback `"Unknown"` |
| `Email/Website` | email | **yes -- reused** | From `email`; omitted if empty |
| `Profile` | select | **yes -- reused** | Derived from `formName` via `PROFILE_BY_FORM`; options: `Coalition Partner`, `Activist Builder`, `Activist Leader / Steward` (the legacy `afformCircleContactForm` has no Notion profile because Notion is skipped) |
| `Organization` | select | **yes -- reused** | From `affiliatedOrgs`; case-insensitive match against existing options; unmatched values create a new option |
| `Website` | url | **yes -- reused** | First entry of `website[]` |
| `Website 2` | url | **yes -- added** | Second entry of `website[]`; omitted if absent |
| `Website 3` | url | **yes -- added** | Third entry of `website[]`; omitted if absent |
| `Website 4` | url | **yes -- added** | Fourth entry of `website[]`; omitted if absent |
| `Website 5` | url | **yes -- added** | Fifth entry of `website[]`; omitted if absent. The form caps the website field at 5 rows (`MAX_WEBSITE_ROWS`), so entries 1-5 map to these columns and the array never overflows |
| `Phone or Social Handle` | phone_number | **yes -- reused** | `chat[]` + `chatService[]` joined as `handle (Service) \| ...` |
| `Mvmt Status` | select | **yes -- reused** | Always written as `New Lead` on intake; other options: `Active`, `Onboarding`, `Approved`, `Redirected - Post Call`, `No Show`, `Call Scheduled`, `Redirected`, `Eligible` |
| `BU` | multi_select | **yes -- reused** | Always written as `Movement`; other options: `IR`, `Comms`, `Ecodev` |
| `Added` | created_time | **yes -- auto** | Read-only; set by Notion on row creation; not written by intake |
| `City` | rich_text | **yes -- added** | From `city`; omitted if empty |
| `Country` | rich_text | **yes -- added** | From `country` (CiviCRM numeric ID mapped to full name via `COUNTRY_MAP`) |
| `Skills` | multi_select | **yes -- added** | From `skills[]` (CiviCRM numeric IDs mapped to labels via `SKILLS_MAP`); 16 options (see below) |
| `Background` | rich_text | **yes -- added** | First non-empty of `backgroundPartner`, `backgroundBuilder`, `backgroundLeader` |
| `Tech Vision` | rich_text | **yes -- added** | From `techVision`; Activist Builder only; omitted if empty |
| `Activities Vision` | rich_text | **yes -- added** | From `activitiesVision`; Activist Leader / Steward only; omitted if empty |
| `Questions` | rich_text | **yes -- added** | From `questions`; omitted if empty |
| `Wants Events` | checkbox | **yes -- added** | From `wantsEvents` boolean |
| `Wants Newsletter` | checkbox | **yes -- added** | From `wantsNewsletter` boolean |
| `Account Owner` | person | no | BD team member assigned to the row |
| `Contacts` | rich_text | no | Free-form contact notes; manually populated |
| `Event Touchpoints` | multi_select | no | Events where the contact was met; options: `EthCC 2025`, `Protocolberg 2025`, `EthDenver 2025`, `EthDam`, `ETHCC`, `Inbound`, `Devcon 2024`, `Decentralized Data Summit`, `Devconnect 2025` |
| `Last Contact` | date | no | Date of most recent BD interaction; manually set |
| `Last edited time` | last_edited_time | no | System-managed; read-only |
| `Nimbus Status` | status | no | Nimbus-specific workflow status; options: `Not started`, `In progress`, `Done` |
| `Platform` | multi_select | no | Technical platform tags; options: `JS Browser`, `JS Electron`, `NodeJS`, `Rust`, `Golang`, `C++` |
| `Priority` | select | no | BD priority; options: `Low`, `Medium`, `High`, `To be established` |
| `Segment` | multi_select | no | Market segment; options: `Social`, `Infrastructure`, `Cross-chain`, `L2`, `Studio`, `DeFi`, `Tooling`, `Nodes`, `AI`, `Wallets`, `Investor`, `Oracle`, `indexer` |
| `Stack` | multi_select | no | Logos stack involvement; options: `Nimbus`, `Logos Storage`, `Logos Messaging`, `Logos Blockchain` |
| `Status` | select | no | BD pipeline stage; options: `Lead`, `Qualified`, `Solution Eng`, `Preliminary interest`, `Confirmed`, `Future`, `Negotiation`, `Lost`, `Archive` |
| `Tags` | multi_select | no | Miscellaneous labels; options include `Wallet dapp SDK user`, `Chat SDK user`, `Potential Waku users`, `Grant Recipient`, `Operator`, and others |
| `Total Funding` | number | no | Funding amount in USD; manually populated |
| `User Persona Type` | multi_select | no | Persona classification; options include `Node Operator`, `Developer`, `Integrator`, `Partner`, `Investor`, `Community`, and others |
| `Waku Solution Engineers` | person | no | Waku team member assigned to the row |

### Skills multi_select options (16)

`Developer`, `Web3 builder`, `Privacy domain expert`, `Website developer`, `Product designer`, `Researcher`, `Activist`, `Project manager`, `Community builder`, `Thought leader / Influencer`, `Creative`, `Marketer`, `Fundraiser`, `Educator`, `Policy advocate`, `Translator`

### How the DB was extended for funnel intake

Thirteen columns were added via `notion-update-data-source` DDL. The pre-existing properties were not modified (the pre-existing `Website` url column is now populated with the first submitted website instead of the old pipe-joined string).

```sql
ADD COLUMN "City" RICH_TEXT;
ADD COLUMN "Country" RICH_TEXT;
ADD COLUMN "Skills" MULTI_SELECT('Developer','Web3 builder','Privacy domain expert','Website developer','Product designer','Researcher','Activist','Project manager','Community builder','Thought leader / Influencer','Creative','Marketer','Fundraiser','Educator','Policy advocate','Translator');
ADD COLUMN "Background" RICH_TEXT;
ADD COLUMN "Tech Vision" RICH_TEXT;
ADD COLUMN "Activities Vision" RICH_TEXT;
ADD COLUMN "Questions" RICH_TEXT;
ADD COLUMN "Wants Events" CHECKBOX;
ADD COLUMN "Wants Newsletter" CHECKBOX;
ADD COLUMN "Website 2" URL;
ADD COLUMN "Website 3" URL;
ADD COLUMN "Website 4" URL;
ADD COLUMN "Website 5" URL
```

**Known limitation:** "Hide when empty" per property cannot be set via the Notion API or MCP. It must be toggled manually in the Notion UI for each of the added properties -- including `Website 2`..`Website 5` (Database -> ... -> Properties -> each property -> Visibility -> Hide when empty).

**Production note:** the four `Website 2`..`Website 5` columns above were added to the **test** database (`ede0c08525554244b940f681318a0891`). The production database referenced by `NOTION_DB_ID` must receive the same four `URL` columns before this ships -- a page POST referencing an unknown property is rejected by the Notion API, which would break live submissions.

---

## Key design decisions

- **One endpoint for all forms** -- hCaptcha tokens are single-use; `/coalition-partner`, `/activist-builder`, and `/activist-leader-steward` all point at `POST /api/public/afform-submit`. The endpoint still accepts the legacy `afformCircleContactForm` formName even though `/connect` (now `/contact`) no longer renders a form.
- **Per-form destination rules** -- the `afformCircleContactForm` path skips Notion and requires CiviCRM (`502` on CiviCRM failure). The three active forms keep Notion required and CiviCRM best-effort.
- **One `Background` column** -- All `background*` textarea variants collapse into a single rich-text property.
- **One column per website** -- `website[]` is spread across discrete url columns: entry 1 -> `Website`, entries 2-5 -> `Website 2`..`Website 5`. Blank rows are dropped first, so the columns fill contiguously. The funnel form caps the website field at 5 rows (`MAX_WEBSITE_ROWS` in `connect-form-section.tsx`), so the array never overflows the available columns. (Previously all entries were pipe-joined into the single `Website` url field.)
- **Joined multi-values** -- `chat[]` -> `handle (Service)` entries in `Phone or Social Handle`.
- **`Organization` grows over time** -- Unmatched submitted values are written as-is and Notion creates a new select option.
- **Env var name** -- `NOTION_DB_ID`.

---

## Testing

```bash
pnpm --filter civi-crm test
```

Notion property mapping: `apps/civi-crm/src/lib/notion/__tests__/build-notion-properties.test.ts`
CiviCRM value building: `apps/civi-crm/src/lib/civicrm/__tests__/build-afform-values.test.ts`
