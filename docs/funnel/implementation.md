# Funnel intake — implementation steps

Phased work to send all three connect intake forms to the **IFT BD CRM -- funnel test** Notion database (primary) and CiviCRM (backup). Database setup: [notion-database.md](./notion-database.md). Overview and design decisions: [README.md](./README.md).

## Overall goal

Movement BD should see every intake submission as one row in a single Notion database, with CiviCRM retaining a parallel Afform record for existing CRM workflows. The web app must not verify hCaptcha twice: one `POST` to `civi-crm`, one token, two backend writes in sequence.

## Step summary

| Step | Goal | Status |
| --- | --- | --- |
| 1. [Schema](#1-notion-schema-ddl) | Add nine intake columns on the existing funnel data source | Done (Notion MCP) |
| 2. [Visibility](#2-hide-when-empty-manual) | Keep legacy CRM rows readable in Notion UI | Manual checklist pending |
| 3. [Notion lib](#3-notion-lib-appscivi-crmsrclibnotion) | Map form payloads → Notion page properties; POST new rows | Done |
| 4. [CiviCRM lib](#4-civicrm-submit-module) | Isolate Afform.submit behind a reusable function | Done |
| 5. [Orchestrator route](#5-orchestrator-afform-submit) | One captcha, Notion required, CiviCRM best-effort | Done |
| 6. [Wire web pages](#6-wire-web-pages) | All three forms → single API endpoint | Done |
| 7. [Cleanup](#7-cleanup) | Remove duplicate route; sync civi-crm docs | Pending |

---

## 1. Notion schema (DDL)

**Goal:** Extend data source `5919873c-d7b1-42ff-acdf-380b62a4176c` with columns the forms need, without deleting or renaming existing CRM properties.

**Done:** Nine columns added via `notion-update-data-source` (`City`, `Country`, `Skills`, `Background`, `Tech Vision`, `Activities Vision`, `Questions`, `Wants Events`, `Wants Newsletter`). Reused: `Name`, `Email/Website`, `Profile`, `Website`, `Organization`, `Phone or Social Handle`, `Mvmt Status`, `Added`.

Details and DDL: [notion-database.md § Schema change](./notion-database.md#schema-change-completed).

---

## 2. Hide when empty (manual)

**Goal:** Per-property **Hide when empty** in Notion so intake-only fields do not clutter rows that predate the funnel forms.

**Done (automation):** Confirmed the Notion API and View DSL cannot set this flag; view-level `HIDE` is not equivalent.

**Pending (operator):** Manual checklist in [notion-database.md § Manual checklist](./notion-database.md#manual-checklist-required).

---

## 3. Notion lib (`apps/civi-crm/src/lib/notion/`)

**Goal:** Self-contained Notion integration with **no imports from CiviCRM** (and no Notion imports in CiviCRM lib code). A thin route orchestrator will call `submitToNotion(formData, formName)` after captcha verification. Removing Notion later means deleting this folder and one call site.

**Status:** Done (committed; not wired to a route yet).

### What changed

The coalition-partner proof-of-concept lived inline in `src/app/api/public/notion-coalition-partner/route.ts` (maps + property builder + HTTP). That route targeted **placeholder property names** from an early schema (`Email`, `Affiliated Organisations`, `Websites`, `Chat Handles`, `About Organisation`, `Submitted At`). The funnel database uses the reuse-first schema in [notion-database.md](./notion-database.md).

| Concern | Legacy `notion-coalition-partner` route | `src/lib/notion/` |
| --- | --- | --- |
| Scope | Coalition Partner only | All three forms via `formName` |
| Property names | Ad-hoc / wrong for funnel DB | Matches funnel DB (`Email/Website`, `Organization`, `Website`, …) |
| `affiliatedOrgs` | Rich text | `Organization` select + case-insensitive option match |
| Profile / movement status | Not set | `Profile` from form; `Mvmt Status` = `New Lead` |
| Submission time | `Submitted At` date written | Omitted — Notion `Added` (created_time) is read-only |
| Background fields | `backgroundPartner` only | Any `background*` → single `Background` column |
| Activist-only fields | N/A | `Tech Vision`, `Activities Vision` when present |
| API version | Was `2022-06-28` in route | `2026-03-11` in `submit.ts` |
| CiviCRM coupling | Route-only | None — only imports `afform-case-defaults` for `PROFILE_BY_FORM` keys |

Empty optional rich-text, url, email, and select properties are **omitted** from the POST body so Notion rows stay sparse until “Hide when empty” is applied in the UI.

### Layout

| File | Role |
| --- | --- |
| `maps.ts` | `SKILLS_MAP`, `CHAT_SERVICE_MAP`, `COUNTRY_MAP`, `PROFILE_BY_FORM`, `MVMT_STATUS_NEW_LEAD` |
| `build-notion-properties.ts` | `buildNotionProperties`, `resolveOrganizationSelect` |
| `submit.ts` | `submitToNotion(formData, formName)` → `{ ok: true }` \| `{ ok: false, message }` |
| `__tests__/build-notion-properties.test.ts` | Property mapping and org resolution |

### Public API

```ts
// submit.ts
submitToNotion(formData: Record<string, unknown>, formName: string): Promise<NotionSubmitResult>

// build-notion-properties.ts (for tests / future reuse)
buildNotionProperties(data, formName, organizationSelect): NotionPageProperties
resolveOrganizationSelect(submitted, existingOptions): string
```

### Runtime behaviour

1. Read `NOTION_API_TOKEN` and `NOTION_COALITION_PARTNER_DB_ID`; return `{ ok: false, message: 'Notion is not configured' }` if either is missing.
2. `GET https://api.notion.com/v1/databases/{id}` — read `Organization` select option names (one request per submission today).
3. `resolveOrganizationSelect(affiliatedOrgs, options)` — lowercase compare; use canonical option name or submitted value for a new option.
4. `buildNotionProperties` — map fields per [notion-database.md](./notion-database.md#property-mapping-reuse-first); join websites and chat with ` | `; map Civi country/skill/chat IDs via `maps.ts`.
5. Always set:
   - `Mvmt Status = New Lead`
   - `BU = Movement`
6. `POST https://api.notion.com/v1/pages` — `parent.database_id`, `properties`; header `Notion-Version: 2026-03-11`.

### Afform `formName` → Profile

| `formName` (API / web `extraPayload`) | Notion `Profile` |
| --- | --- |
| `afformCoalitionPartner` | Coalition Partner |
| `afformActivistBuilder` | Activist Builder |
| `afformActivistLeaderSteward` | Activist Leader / Steward |

### Background field routing

| Form | Form keys | Notion column |
| --- | --- | --- |
| Coalition Partner | `backgroundPartner` | `Background` |
| Activist Builder | `backgroundBuilder` | `Background` |
| Activist Builder | `techVision` | `Tech Vision` |
| Activist Leader / Steward | `backgroundLeader` | `Background` |
| Activist Leader / Steward | `activitiesVision` | `Activities Vision |

`getBackground` uses the first non-empty `backgroundPartner` \| `backgroundBuilder` \| `backgroundLeader`.

### Wired through orchestrator

`submitToNotion` is called by `POST /api/public/afform-submit` after hCaptcha verification (unless disabled via env; see §5).

---

## 4. CiviCRM submit module

**Goal:** Mirror the Notion split — extract `buildAfformValues` + `Afform.submit` HTTP into `src/lib/civicrm/submit-afform.ts` with **no** Notion imports. The orchestrator calls `submitToCiviCrm(formData, fieldDefs, formName)` after Notion succeeds.

**Status:** Done.

| Piece | Location |
| --- | --- |
| `buildAfformValues` | `src/lib/civicrm/build-afform-values.ts` (shared) |
| Afform.submit fetch | `src/lib/civicrm/submit-afform.ts` |
| Case defaults on intake | `src/lib/civicrm/afform-case-defaults.ts` |

The route orchestrator should treat CiviCRM as a backup destination by default (see §5).

---

## 5. Orchestrator (`afform-submit`)

**Goal:** Replace split behaviour (activist → Civi only, coalition → Notion only) with one handler: validate, captcha once, Notion required, CiviCRM best-effort.

**Target flow** (`POST /api/public/afform-submit`):

1. Validate body, `formName`, and `fields` (Afform field defs).
2. Verify hCaptcha when `HCAPTCHA_SECRET` is set.
3. Check opt-out flags:
   - `FUNNEL_INTAKE_NOTION_DISABLED` (truthy → skip Notion)
   - `FUNNEL_INTAKE_CIVICRM_DISABLED` (truthy → skip CiviCRM)
4. If Notion is enabled: `submitToNotion(formData, formName)` — **required**; on failure return an error to the user.
5. If CiviCRM is enabled: `submitToCiviCrm(...)` — **best-effort** when Notion is enabled; on failure still return success with `detail` in the JSON body (no `console.log`).
6. CORS: the route supports `OPTIONS` and includes permissive `Access-Control-Allow-*` headers so the static `apps/web` site can POST cross-origin.

**Status:** Done.

### Opt-out behaviour (per destination)

- Default (no flags set): **Notion required**, CiviCRM best-effort.
- Notion disabled only: CiviCRM becomes required (errors become fatal).
- CiviCRM disabled only: Notion required; no CiviCRM call is made.
- Both disabled: route returns success after captcha (useful for local dry-runs).

---

## 6. Wire web pages

**Goal:** All three intake pages use the same `apiEndpoint` builder pointing at `/api/public/afform-submit`.

| Page | Endpoint today | Target |
| --- | --- | --- |
| Activist Builder | `afform-submit` | `afform-submit` (unchanged) |
| Activist Leader / Steward | `afform-submit` | `afform-submit` (unchanged) |
| Coalition Partner | `notion-coalition-partner` | `afform-submit` |

**Status:** Done — all three pages post to `POST /api/public/afform-submit`.

---

## 7. Cleanup

**Goal:** One code path for Notion writes; civi-crm docs list the public intake routes accurately.

| Task | Status |
| --- | --- |
| Delete `src/app/api/public/notion-coalition-partner/route.ts` after orchestrator ships | Pending |
| Update `docs/civi-crm/architecture.md` and `apps/civi-crm/AGENTS.md` | Pending |
| Confirm `NOTION_API_TOKEN` and `NOTION_COALITION_PARTNER_DB_ID` in non-local deploy envs | Operator |

---

## Testing

```bash
pnpm --filter civi-crm test
```

Notion property mapping: `apps/civi-crm/src/lib/notion/__tests__/build-notion-properties.test.ts`.

CiviCRM value building: `apps/civi-crm/src/lib/civicrm/__tests__/build-afform-values.test.ts`.

End-to-end intake (Notion row + Civi case) requires the orchestrator and env vars on a running `civi-crm` instance.
