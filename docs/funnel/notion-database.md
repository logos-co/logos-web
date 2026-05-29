# Notion funnel database — schema and visibility

Setup for data source `5919873c-d7b1-42ff-acdf-380b62a4176c` (**IFT BD CRM -- funnel test**). Overview and goals: [README.md](./README.md).

## Property mapping (reuse-first)

### Reused properties (no schema change)

| Form field | Notion property | Type | Write behaviour |
| --- | --- | --- | --- |
| `name` | Name | title | Submitted value |
| `email` | Email/Website | email | Submitted value |
| `website[]` | Website | url | Multiple URLs joined pipe-separated into one url field |
| `chat[]` / `chatService[]` | Phone or Social Handle | phone_number | Joined as `handle (service)` per entry |
| `affiliatedOrgs` | Organization | select | Case-insensitive match → canonical option name; else submitted value (new option) |
| `formName` | Profile | select | `Coalition Partner`, `Activist Builder`, or `Activist Leader / Steward` |
| — | Added | created_time | Read-only; set by Notion on create |
| — | Mvmt Status | select | Always `New Lead` on new intake rows |

### New properties (added via DDL)

| Form field(s) | Notion property | Type |
| --- | --- | --- |
| `city` | City | rich text |
| `country` | Country | rich text |
| `skills` | Skills | multi_select (16 options; see below) |
| `backgroundPartner` / `backgroundBuilder` / `backgroundLeader` | Background | rich text |
| `techVision` | Tech Vision | rich text |
| `activitiesVision` | Activities Vision | rich text |
| `questions` | Questions | rich text |
| `wantsEvents` | Wants Events | checkbox |
| `wantsNewsletter` | Wants Newsletter | checkbox |

### Code implementation

Property names and write rules above are implemented in `apps/civi-crm/src/lib/notion/` (`build-notion-properties.ts`, `submit.ts`). Step goals and legacy-route differences: [implementation.md § 3](./implementation.md#3-notion-lib-appscivi-crmsrclibnotion).

---

### Skills multi_select options

`Developer`, `Web3 builder`, `Privacy domain expert`, `Website developer`, `Product designer`, `Researcher`, `Activist`, `Project manager`, `Community builder`, `Thought leader / Influencer`, `Creative`, `Marketer`, `Fundraiser`, `Educator`, `Policy advocate`, `Translator`

---

## Schema change (completed)

**Status:** Applied via Notion MCP `notion-update-data-source` on `5919873c-d7b1-42ff-acdf-380b62a4176c`.

**Goal:** Add the nine intake-specific columns without altering or removing existing CRM properties.

DDL executed (single semicolon-separated batch):

```sql
ADD COLUMN "City" RICH_TEXT;
ADD COLUMN "Country" RICH_TEXT;
ADD COLUMN "Skills" MULTI_SELECT('Developer','Web3 builder','Privacy domain expert','Website developer','Product designer','Researcher','Activist','Project manager','Community builder','Thought leader / Influencer','Creative','Marketer','Fundraiser','Educator','Policy advocate','Translator');
ADD COLUMN "Background" RICH_TEXT;
ADD COLUMN "Tech Vision" RICH_TEXT;
ADD COLUMN "Activities Vision" RICH_TEXT;
ADD COLUMN "Questions" RICH_TEXT;
ADD COLUMN "Wants Events" CHECKBOX;
ADD COLUMN "Wants Newsletter" CHECKBOX
```

Notion stores rich-text columns as type `text` in the data-source schema API response. Checkbox and multi_select types match the plan.

**Verification:** Fetch the data source (`collection://5919873c-d7b1-42ff-acdf-380b62a4176c`) and confirm all nine names appear in `schema` alongside unchanged reused properties.

---

## Property visibility — “Hide when empty”

### Goal

Keep board/table views readable: intake-only columns should not show empty cells on legacy CRM rows. Notion’s **Hide when empty** (per property) hides a field on a row until that row has a value.

### API / MCP limitation

| Mechanism | Can set “Hide when empty”? |
| --- | --- |
| `notion-update-data-source` (DDL) | No — schema only |
| View DSL `SHOW` / `HIDE` (`notion-update-view`) | No — hides columns **in that view** for all rows, not conditionally per row |
| View DSL `HIDE WHEN EMPTY` | **Not supported** — returns `validation_error` (invalid DSL) |
| Notion UI | **Yes** — property → Visibility → Hide when empty |

**Attempted (for the record):**

- `HIDE WHEN EMPTY "City", "Country"` on view **Movement - Forms** (`view://36fffb51-c0be-81a8-b6b3-000c6f47015d`) — rejected by the API.
- Plain `HIDE "City", ...` on the same view — works but is the wrong behaviour (column hidden for every row in that view). The view was restored to its prior `displayProperties` after the test.

### Manual checklist (required)

In Notion, open [IFT BD CRM -- funnel test](https://www.notion.so/ede0c08525554244b940f681318a0891) → **⋯** → **Properties** (or open a property from a column header → **Edit property**).

For **each** property below: **Visibility** → **Hide when empty**.

- [ ] City
- [ ] Country
- [ ] Skills
- [ ] Background
- [ ] Tech Vision
- [ ] Activities Vision
- [ ] Questions
- [ ] Wants Events
- [ ] Wants Newsletter

Do **not** change visibility on reused properties unless you want that separately.

**Optional (view-level):** On **Movement - Forms** (or other views), add the new columns via the view **Properties** picker when you want them visible in that layout. That is independent of “Hide when empty”.

---

## Implementation roadmap

Phased goals, status, and file-level notes: [implementation.md](./implementation.md).
