# Funnel intake -- architecture reference

Target audience: AI agents reading this codebase.

## What this is

Three public funnel forms (Coalition Partner, Activist Builder, Activist Leader / Steward) post to a single API endpoint on `apps/civi-crm`. They write to Notion, plus the n8n/Baserow webhook for the steward form.

**`/connect` is now `/contact`, and its form content was removed because it is no longer used.** The route at `apps/web/app/[locale]/contact/page.tsx` now redirects to the home page. Its `afformCircleContactForm` `formName` is no longer accepted by the endpoint: it only ever wrote to CiviCRM, which is gone (logos-web#123).

---

## Request flow

```
apps/web (static)
  └── connect-form-section.tsx
        │  POST { formName, captchaToken, ...formFields }
        ▼
apps/civi-crm
  POST /api/public/afform-submit
  ├── 1. validate body and formName (must be one of the three allowed values)
  ├── 2. require a known `hearAbout` option id
  ├── 3. require every other field the form marks required (`findInvalidRequiredFields`)
  ├── 4. verify hCaptcha (once, single-use token -- cannot verify twice)
  ├── 5. submitToN8n(formData, formName)     -- steward form only; best-effort (logged on failure)
  └── 6. submitToNotion(formData, formName)  -- unless FUNNEL_INTAKE_NOTION_DISABLED; failure → 502
```

The reason the writes share one handler: hCaptcha tokens are single-use. One POST, one token, the backend writes in sequence.

After that POST resolves successfully, `apps/web` fires the newsletter opt-ins on its own (see below). They are not part of the `afform-submit` request.

---

## Newsletter opt-ins (logos-web#116)

Each ticked checkbox subscribes the submitted email to a Ghost newsletter via `admin-acid.logos.co` and attaches a note to the member profile.

| Checkbox | `formKey` | Newsletter | Ghost id |
| --- | --- | --- | --- |
| "I want to receive the Logos Newsletter" | `wantsNewsletter` | Logos Newsletter | `6913441fee2f120001cec90d` |
| "I want to be informed about events in my city" | `wantsEvents` | Regional Newsletter | `6a672fa7d5b09400014fffa1` |

Each field is its own line; blank ones are omitted entirely.

```
Profile: <profile>
```

```
City: <city>
Country: <country>
Profile: <profile>
```

`<profile>` is the same string the Notion `Profile` select gets -- `PROFILE_BY_FORM_NAME` in `@repo/funnel`, read through `getProfileForForm` on both sides. `country` arrives as a numeric option id and is resolved to its label against the form's own options before it reaches the note; an unresolvable id is dropped.

Alongside the note, each subscription forwards the submitted answers: the form values plus `formName`, flattened into the request body as top-level fields. The captcha token stays out -- it is intake plumbing. The upstream hands the answers to its auto-reply filters; nothing here allowlists individual fields, so a new form field needs no change in `apps/web`.

Every select value is sent as its **label**, not the option id (`toLabelledFormFields`): the subscribe endpoint has no access to the option lists, so `country: "1003"` would be unreadable where `country: "Algeria"` is not. Ids that resolve to nothing are dropped. Text fields and checkboxes pass through untouched, and the resolved keys (`email`, `type`, `newsletter`, `note`) are written last so a same-named form field can never overwrite them.

| Path | Role |
| --- | --- |
| `apps/web/lib/funnel-newsletter-signup.ts` | Builds the notes, fires the subscriptions |
| `apps/web/lib/newsletter-signup.ts` | Shared transport; `NEWSLETTER_IDS`, optional verbatim `note`, `formFields` pass-through |

Three constraints shape it:

- **Client-side.** `apps/web` is a static export, so there is no route to proxy through -- same as the footer signup. `admin-acid.logos.co` allowlists Logos-owned origins for CORS, so these calls always fail on `localhost`; unit tests are the verification.
- **Never throws.** It runs after the intake POST has already succeeded and its captcha token is spent, so a subscription failure is swallowed and logged rather than surfaced -- otherwise a successful submission would render as a network error (and would do so on every local submit).
- **Sequential, Logos first.** The upstream folds the note into the member's existing note with a read-modify-write against the Ghost admin API (`mergeNote`: entries joined by a blank line, exact duplicates skipped). Firing both concurrently races that read and loses one note.

---

## Code layout

| Path | Role |
| --- | --- |
| `apps/civi-crm/src/app/api/public/afform-submit/route.ts` | Orchestrator: validation, captcha, calls the destination libs |
| `apps/civi-crm/src/lib/intake-submit-flags.ts` | Reads the `FUNNEL_INTAKE_NOTION_DISABLED` env flag |
| `apps/civi-crm/src/lib/notion/maps.ts` | `SKILLS_MAP`, `CHAT_SERVICE_MAP`, `COUNTRY_MAP`, `MVMT_STATUS_NEW_LEAD`, `BU_MOVEMENT`; re-exports `HEAR_ABOUT_MAP` / `HEAR_ABOUT_QUESTION` from `@repo/funnel` |
| `packages/funnel/src/index.ts` | `@repo/funnel` -- single source of truth for the "How did you first hear about Logos?" question, options, and id → label map, and for `PROFILE_BY_FORM_NAME` / `getProfileForForm` |
| `packages/funnel/src/required-fields.ts` | `REQUIRED_FIELDS_BY_FORM` / `findInvalidRequiredFields` -- single source of truth for which answers each form requires; read by both the `apps/web` schema and the endpoint |
| `apps/web/lib/funnel-newsletter-signup.ts` | Post-submit Ghost newsletter opt-ins (`wantsNewsletter` / `wantsEvents`) |
| `apps/web/lib/funnel-forms/afform-*.ts` | Hand-maintained form definitions (fields + option lists) per funnel form |
| `apps/web/lib/funnel-forms/types.ts` | `AfformField` / `AfformConfig` / `AfformOptions` shapes those files satisfy |
| `apps/web/lib/funnel-forms/contactFormSchema.ts` | Builds the zod schema from the form definition and the required list it is given |
| `apps/web/lib/funnel-forms/hear-about-field.ts` | "How did you first hear about Logos?" field def + `withHearAboutField` injector used by the three form pages |
| `apps/civi-crm/src/lib/notion/build-notion-properties.ts` | `buildNotionProperties` |
| `apps/civi-crm/src/lib/notion/submit.ts` | `submitToNotion` -- resolves the data source, builds properties, POSTs page |
| `apps/civi-crm/src/lib/n8n/build-payload.ts` | `buildN8nPayload` -- merges id-based answers with their labels |
| `apps/civi-crm/src/lib/n8n/submit.ts` | `submitToN8n` -- steward webhook POST |
| `apps/civi-crm/src/lib/notion/__tests__/build-notion-properties.test.ts` | Property mapping unit tests |

The Notion and n8n libs are independent apart from the shared id → label maps. Removing one means deleting its folder and one call site in the orchestrator.

---

## Forms and `formName`

| Web page | `formName` in POST body | Notion `Profile` value |
| --- | --- | --- |
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

### Required for live submissions

| Variable | Purpose |
| --- | --- |
| `HCAPTCHA_SECRET` | Verify captcha tokens from `apps/web` |
| `N8N_STEWARD_WEBHOOK_TOKEN` | `X-Webhook-Token` for the steward webhook; unset = steward forward skipped |

### Optional opt-outs

| Variable | Effect when truthy (`1`, `true`, `yes`, `on`) |
| --- | --- |
| `FUNNEL_INTAKE_NOTION_DISABLED` | Skip the Notion write; the endpoint still returns `201` |

Default (no flag set): all three forms write to Notion, and a Notion failure fails the submission with `502`.

---

## `submitToNotion` runtime behaviour

1. Read `NOTION_API_TOKEN` and `NOTION_DB_ID`; return `{ ok: false }` if either is missing.
2. `resolveDataSourceId(databaseId)` -- use `NOTION_DATA_SOURCE_ID` if pinned, else `GET /v1/databases/{id}` and fall back to the sole data source (errors if multiple and none pinned).
3. `buildNotionProperties(formData, formName)` -- see field mapping below.
4. `POST /v1/pages` with `parent.data_source_id` and `properties`. Notion API version: `2026-03-11`.
5. Return `{ ok: true }` or `{ ok: false, message }`.

Empty optional properties (rich text, url, email, select) are omitted from the POST body so rows stay sparse.

---

## IFT BD CRM -- full database schema

The table below lists every property in the database as of 2026-05-29. The **Funnel** column marks whether the funnel intake writes to the property, and how.

| Property | Notion type | Funnel | Notes |
| --- | --- | --- | --- |
| `Name` | title | **yes -- reused** | From form `name`; fallback `"Unknown"` |
| `Email/Website` | email | **yes -- reused** | From `email`; omitted if empty |
| `Profile` | select | **yes -- reused** | Derived from `formName` via `getProfileForForm`; options: `Coalition Partner`, `Activist Builder`, `Activist Leader / Steward` |
| `Mvmt Organization` | text | **yes -- added** | From `affiliatedOrgs`; written as-is (rich text, clamped to 2000 chars); omitted if empty |
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
| `Country` | rich_text | **yes -- added** | From `country` (numeric option id mapped to full name via `COUNTRY_MAP`) |
| `Skills` | multi_select | **yes -- added** | From `skills[]` (numeric option ids mapped to labels via `SKILLS_MAP`); 16 options (see below) |
| `Background` | rich_text | **yes -- added** | First non-empty of `backgroundPartner`, `backgroundBuilder`, `backgroundLeader` |
| `Tech Vision` | rich_text | **yes -- added** | From `techVision`; Activist Builder only; omitted if empty |
| `Activities Vision` | rich_text | **yes -- added** | From `activitiesVision`; Activist Leader / Steward only; omitted if empty |
| `Questions` | rich_text | **yes -- added** | From `questions`; omitted if empty |
| `Wants Events` | checkbox | **yes -- added** | From `wantsEvents` boolean |
| `Wants Newsletter` | checkbox | **yes -- added** | From `wantsNewsletter` boolean |
| `How did you first hear about Logos?` | select | **yes -- added** | From `hearAbout` (numeric option id mapped via `HEAR_ABOUT_MAP`); unknown ids are dropped (property omitted) so tampering can't create new select options; options: `Friend or colleague`, `Social media`, `Search engine`, `Event or conference`, `Another community or organization`, `Podcast`, `News/article/blog`, `Other` |
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

On 2026-07-06 one more column was added (to the **production** database, `5b951a531bd94db9b0078e11640e1051` / data source `9fe0dc96-98dc-493b-8e09-37c17f020872`) for issue [logos-web#90](https://github.com/logos-co/logos-web/issues/90):

```sql
ADD COLUMN "How did you first hear about Logos?" SELECT('Friend or colleague','Social media','Search engine','Event or conference','Another community or organization','Podcast','News/article/blog','Other')
```

**Known limitation:** "Hide when empty" per property cannot be set via the Notion API or MCP. It must be toggled manually in the Notion UI for each of the added properties -- including `Website 2`..`Website 5` (Database -> ... -> Properties -> each property -> Visibility -> Hide when empty).

**Production note:** the four `Website 2`..`Website 5` columns above were added to the **test** database (`ede0c08525554244b940f681318a0891`). The production database referenced by `NOTION_DB_ID` must receive the same four `URL` columns before this ships -- a page POST referencing an unknown property is rejected by the Notion API, which would break live submissions.

---

## Key design decisions

- **One endpoint for all forms** -- hCaptcha tokens are single-use; `/coalition-partner`, `/activist-builder`, and `/activist-leader-steward` all point at `POST /api/public/afform-submit`.
- **Per-form destination rules** -- all three forms write to Notion (`502` on failure). Only the steward form is additionally forwarded to the n8n/Baserow webhook, and that forward is best-effort: a failure is logged and the submission still returns `201`.
- **One `Background` column** -- All `background*` textarea variants collapse into a single rich-text property.
- **One column per website** -- `website[]` is spread across discrete url columns: entry 1 -> `Website`, entries 2-5 -> `Website 2`..`Website 5`. Blank rows are dropped first, so the columns fill contiguously. The funnel form caps the website field at 5 rows (`MAX_WEBSITE_ROWS` in `connect-form-section.tsx`), so the array never overflows the available columns. (Previously all entries were pipe-joined into the single `Website` url field.)
- **Joined multi-values** -- `chat[]` -> `handle (Service)` entries in `Phone or Social Handle`.
- **`Mvmt Organization` is free text** -- `affiliatedOrgs` is written verbatim to the `Mvmt Organization` rich-text column (clamped to 2000 chars), keeping the curated `Organization` select free of intake noise. (Intake no longer writes to `Organization`.)
- **`hearAbout` is spliced in at page level** -- its def lives in `apps/web/lib/funnel-forms/hear-about-field.ts` rather than in the per-form definitions, and `withHearAboutField` inserts it after `chatService` (a no-op if a form ever defines the field itself). The endpoint rejects a submission whose `hearAbout` is missing or is not a known option id, so the check cannot be skipped client-side. The question, option list, and id → label map live once in `@repo/funnel` (`packages/funnel`); the question string doubles as the Notion property name, so rewording it means renaming the property in Notion first.
- **One required-field list, read by both sides** -- `REQUIRED_FIELDS_BY_FORM` in `@repo/funnel` is the only place a funnel field is marked required. The form pages pass it into `ConnectFormSection`, which builds the zod schema and the asterisks from it, and the endpoint rejects a payload missing any of them with `400 Missing or invalid required fields` (the response names the offending `fields`). The form definitions under `apps/web/lib/funnel-forms/` carry no `required` flag -- they describe rendering only. `email` is additionally checked for a plausible address; that pattern is looser than the client's zod `.email()` on purpose, so the endpoint can never reject what the form accepted. What the two sides still implement separately is what counts as an *answer* (zod vs `isAnswered`), which is what `apps/web/lib/funnel-forms/__tests__/required-fields-parity.test.ts` covers.
- **Newsletter opt-ins are fire-and-forget from the client** -- they run after the intake POST resolves, never block it, and never fail it. See the section above.
- **Env var name** -- `NOTION_DB_ID`.

---

## Testing

```bash
pnpm --filter civi-crm test
pnpm --filter web test
```

Notion property mapping: `apps/civi-crm/src/lib/notion/__tests__/build-notion-properties.test.ts`
n8n payload building: `apps/civi-crm/src/lib/n8n/__tests__/build-payload.test.ts`
Endpoint behaviour: `apps/civi-crm/src/app/api/public/afform-submit/__tests__/route.test.ts`
Endpoint agrees with the form schema: `apps/web/lib/funnel-forms/__tests__/required-fields-parity.test.ts`
Newsletter opt-ins: `apps/web/lib/__tests__/funnel-newsletter-signup.test.ts`
Subscribe payload: `apps/web/lib/__tests__/newsletter-signup.test.ts`
