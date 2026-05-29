# Funnel intake — implementation steps

Phased work to send all three connect intake forms to the Notion funnel database (primary) and CiviCRM (backup). Database setup: [notion-database.md](./notion-database.md). Overview: [README.md](./README.md).

## Step summary

| Step | Goal | Status |
| --- | --- | --- |
| 1. [Schema](#1-notion-schema-ddl) | Add nine intake columns on the existing funnel data source | Done (Notion MCP) |
| 2. [Visibility](#2-hide-when-empty-manual) | Keep legacy CRM rows readable in Notion UI | Manual checklist pending |
| 3. [Notion lib](#3-notion-lib-appscivi-crmsrclibnotion) | Map form payloads → Notion page properties; POST new rows | Done |
| 4. [CiviCRM lib](#4-civicrm-submit-module) | Isolate Afform.submit behind a reusable function | Partial |
| 5. [Orchestrator route](#5-orchestrator-afform-submit) | One captcha, Notion required, CiviCRM best-effort | Pending |
| 6. [Wire web pages](#6-wire-web-pages) | All three forms → single API endpoint | Partial |
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

**Goal:** Self-contained Notion integration with no imports from CiviCRM code (and vice versa). Callers pass raw form JSON plus the Afform `formName`; the module returns success or an error message.

**Status:** Done.

### Layout

| File | Role |
| --- | --- |
| `maps.ts` | `SKILLS_MAP`, `CHAT_SERVICE_MAP`, `COUNTRY_MAP`, `PROFILE_BY_FORM`, `MVMT_STATUS_NEW_LEAD` |
| `build-notion-properties.ts` | `buildNotionProperties`, `resolveOrganizationSelect` |
| `submit.ts` | `submitToNotion(formData, formName)` |
| `__tests__/build-notion-properties.test.ts` | Property mapping and org resolution |

### Behaviour

1. Read `NOTION_API_TOKEN` and `NOTION_COALITION_PARTNER_DB_ID`; return `{ ok: false }` if missing.
2. `GET /v1/databases/{id}` — load `Organization` select options.
3. `resolveOrganizationSelect` — case-insensitive match on `affiliatedOrgs`; otherwise use submitted string (Notion may create a new option).
4. `buildNotionProperties` — map fields per [notion-database.md](./notion-database.md#property-mapping-reuse-first); set `Mvmt Status` to `New Lead`; set `Profile` from `PROFILE_BY_FORM[formName]`.
5. `POST /v1/pages` — create row; Notion API version header `2026-03-11`.

### Afform `formName` → Profile

| `formName` (API / web) | Notion `Profile` |
| --- | --- |
| `afformCoalitionPartner` | Coalition Partner |
| `afformActivistBuilder` | Activist Builder |
| `afformActivistLeaderSteward` | Activist Leader / Steward |

### Not wired yet

`submitToNotion` is not called from any route. Coalition Partner still posts to `/api/public/notion-coalition-partner` (inline logic in that route file). Steps 5–6 will switch all forms to the orchestrator.

---

## 4. CiviCRM submit module

**Goal:** Extract `buildAfformValues` + `Afform.submit` HTTP call into `src/lib/civicrm/submit-afform.ts` (or equivalent) with **no** Notion imports, so the orchestrator can call CiviCRM backup writes in one line.

**Status:** Partial.

| Piece | Location today |
| --- | --- |
| `buildAfformValues` | `src/lib/civicrm/build-afform-values.ts` (shared) |
| Afform.submit fetch | Inline in `src/app/api/public/afform-submit/route.ts` |
| Case defaults on intake | `src/lib/civicrm/afform-case-defaults.ts` |

**Remaining:** Move the fetch + error handling into `submitToCiviCrm(formData, fieldDefs, formName)` and thin the route handler.

---

## 5. Orchestrator (`afform-submit`)

**Goal:** Single public endpoint so the web app sends one hCaptcha token once; both backends write after a single verification.

**Target flow** (`POST /api/public/afform-submit`):

1. Validate body, `formName`, and `fields` (Afform field defs).
2. Verify hCaptcha when `HCAPTCHA_SECRET` is set.
3. `submitToNotion(formData, formName)` — **required**; on failure return 5xx/4xx to the user.
4. `submitToCiviCrm(...)` — **best-effort**; on failure still return success if Notion succeeded, with `detail` in the JSON body (no `console.log`).

**Status:** Pending. Current `afform-submit` route only calls CiviCRM (steps 1–2 and 4’s Civi path only).

---

## 6. Wire web pages

**Goal:** All three intake pages use the same `apiEndpoint` builder pointing at `/api/public/afform-submit`.

| Page | Endpoint today | Target |
| --- | --- | --- |
| Activist Builder | `afform-submit` | `afform-submit` (unchanged) |
| Activist Leader / Steward | `afform-submit` | `afform-submit` (unchanged) |
| Coalition Partner | `notion-coalition-partner` | `afform-submit` |

**Status:** Partial — activist pages already correct; coalition-partner still uses `notion-coalition-partner` in `apps/web/app/[locale]/coalition-partner/page.tsx`.

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
