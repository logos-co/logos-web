# Funnel intake

How the three public funnel forms on `apps/web` reach the intake endpoint on
`apps/api` and land in Notion (and, for the steward form, an n8n/Baserow
webhook), including the Notion database schema and the shared option maps. Covers
[`apps/api/src/app/api/public/afform-submit/route.ts`](../../apps/api/src/app/api/public/afform-submit/route.ts),
[`apps/web/lib/funnel-forms`](../../apps/web/lib/funnel-forms),
[`apps/web/lib/funnel-newsletter-signup.ts`](../../apps/web/lib/funnel-newsletter-signup.ts) and
[`packages/funnel/src`](../../packages/funnel/src).

## What this is

Three public funnel forms post to one API endpoint, which writes them to Notion
and, for the steward form, also to an n8n/Baserow webhook:

- Coalition Partner: `/coalition-partner`
- Activist Builder: `/activist-builder`
- Activist Leader / Steward: `/activist-leader-steward`

`/contact` (`apps/web/app/[locale]/contact/page.tsx`) redirects to the home page
and carries no form, so the endpoint does not accept an `afformCircleContactForm`
`formName`.

The endpoint's internals (validation steps, env vars, CORS, the Notion write
path, tests) are documented in
[apps/api/docs/architecture.md](../../apps/api/docs/architecture.md). This doc
covers the flow end to end and the Notion schema.

## End to end flow

```
apps/web (static, ConnectFormSection)
  -> POST { formName, captchaToken, ...formFields }
apps/api
  POST /api/public/afform-submit
  -> validates, verifies hCaptcha, forwards to Notion and (steward only) n8n
```

All three forms share one handler because hCaptcha tokens are single-use: one
POST, one token, the backend writes in sequence. After the POST resolves,
`apps/web` fires the newsletter opt-ins on its own; they are not part of the
`afform-submit` request.

## Forms and formName

| Web page                   | `formName` in POST body       | Notion `Profile` value      |
| -------------------------- | ----------------------------- | --------------------------- |
| `/coalition-partner`       | `afformCoalitionPartner`      | `Coalition Partner`         |
| `/activist-builder`        | `afformActivistBuilder`       | `Activist Builder`          |
| `/activist-leader-steward` | `afformActivistLeaderSteward` | `Activist Leader / Steward` |

The profile mapping is `PROFILE_BY_FORM_NAME` in `packages/funnel/src/index.ts`,
read through `getProfileForForm` on both sides.

## Shared values in @repo/funnel

`packages/funnel` (`@repo/funnel`) is the single source of truth for the values
both sides read, so a submitted id always resolves to the label the visitor
picked.

- `HEAR_ABOUT_QUESTION` and `HEAR_ABOUT_OPTIONS` (`src/index.ts`): the "How did
  you first hear about Logos?" question and its options. The question string
  doubles as the Notion select property name, and the labels are its select
  options, so rewording either means renaming the property or options in Notion
  first.
- `PROFILE_BY_FORM_NAME` / `getProfileForForm` (`src/index.ts`): the per-form
  Notion `Profile` label (the table above).
- `SKILLS_OPTIONS` / `CHAT_SERVICE_OPTIONS` / `COUNTRY_OPTIONS`
  (`src/form-options.ts`): the dropdown options the three forms share. `apps/web`
  renders them through `AFFORM_OPTIONS` (`lib/funnel-forms/afform-options.ts`);
  `apps/api` resolves ids back to labels through `SKILLS_MAP` /
  `CHAT_SERVICE_MAP` / `COUNTRY_MAP` and `HEAR_ABOUT_MAP`, all `toLabelMap()` over
  the same arrays.

`Skills` labels double as the options of the Notion `multi_select` of the same
name. `Country` is rich text and takes any label.

Skills options (16): `Developer`, `Web3 builder`, `Privacy domain expert`,
`Website developer`, `Product designer`, `Researcher`, `Activist`,
`Project manager`, `Community builder`, `Thought leader / Influencer`,
`Creative`, `Marketer`, `Fundraiser`, `Educator`, `Policy advocate`,
`Translator`.

Hear-about options (8): `Friend or colleague`, `Social media`, `Search engine`,
`Event or conference`, `Another community or organization`, `Podcast`,
`News/article/blog`, `Other`.

`REQUIRED_FIELDS_BY_FORM` (`src/required-fields.ts`) is the single place a funnel
field is marked required. The form pages pass it into `ConnectFormSection`, which
builds the zod schema and the asterisks from it, and the endpoint rejects a
payload missing any of them. The per-form definitions under
`apps/web/lib/funnel-forms/` carry no `required` flag; they describe rendering
only. `email` is also checked for a plausible address, with a looser pattern than
the client's zod `.email()` so the endpoint never rejects what the form accepted.

The rules for keeping these in sync live in
[apps/api/AGENTS.md](../../apps/api/AGENTS.md) and
[packages/funnel/AGENTS.md](../../packages/funnel/AGENTS.md).

## Code layout

| Path                                                 | Role                                                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `apps/api/src/app/api/public/afform-submit/route.ts` | Orchestrator: validation, captcha, calls the destination libs                        |
| `apps/api/src/lib/intake-submit-flags.ts`            | Reads the `FUNNEL_INTAKE_NOTION_DISABLED` env flag                                   |
| `apps/api/src/lib/notion/maps.ts`                    | `MVMT_STATUS_NEW_LEAD`, `BU_MOVEMENT`; re-exports the `@repo/funnel` maps            |
| `apps/api/src/lib/notion/build-notion-properties.ts` | `buildNotionProperties` and `resolveHearAboutLabel`                                  |
| `apps/api/src/lib/notion/constants.ts`               | Notion API base URL, version, 2000 char text limit                                   |
| `apps/api/src/lib/notion/evaluation-template.ts`     | Evaluation template blocks attached to every new page                                |
| `apps/api/src/lib/notion/submit.ts`                  | `submitToNotion`: resolves the data source, builds properties, POSTs the page        |
| `apps/api/src/lib/n8n/build-payload.ts`              | `buildN8nPayload`: merges id-based answers with their labels                         |
| `apps/api/src/lib/n8n/constants.ts`                  | `N8N_STEWARD_WEBHOOK_URL`                                                            |
| `apps/api/src/lib/n8n/submit.ts`                     | `submitToN8n`: steward webhook POST                                                  |
| `packages/funnel/src/index.ts`                       | `@repo/funnel` entry point; re-exports the modules below                             |
| `packages/funnel/src/form-options.ts`                | The shared option lists and the maps derived from them                               |
| `packages/funnel/src/required-fields.ts`             | `REQUIRED_FIELDS_BY_FORM` / `findInvalidRequiredFields`                              |
| `apps/web/lib/funnel-newsletter-signup.ts`           | Post-submit Ghost newsletter opt-ins                                                 |
| `apps/web/lib/funnel-forms/afform-*.ts`              | Hand-maintained field definitions per form; rendering only                           |
| `apps/web/lib/funnel-forms/afform-options.ts`        | `AFFORM_OPTIONS`: the `@repo/funnel` option lists keyed by `formKey`                 |
| `apps/web/lib/funnel-forms/contactFormSchema.ts`     | Builds the zod schema from the form definition and the required list                 |
| `apps/web/lib/funnel-forms/hear-about-field.ts`      | Hear-about field def plus `withHearAboutField`, which inserts it after `chatService` |
| `apps/web/lib/funnel-forms/types.ts`                 | The `Afform*` shapes those files satisfy                                             |

The Notion and n8n libs are independent apart from the shared id to label maps.
Removing one means deleting its folder and one call site in the orchestrator.

## Notion database schema

The intake writes to the "IFT BD CRM" database. The table lists every property
as recorded 2026-05-29; the **Funnel** column says whether and how the intake
writes it. The `yes` rows are what `buildNotionProperties` produces; the `no`
rows are maintained by hand in Notion.

| Property                              | Notion type      | Funnel      | Notes                                                                                                                                                                               |
| ------------------------------------- | ---------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Name`                                | title            | yes, reused | From form `name`; fallback `"Unknown"`                                                                                                                                              |
| `Email/Website`                       | email            | yes, reused | From `email`; omitted if empty                                                                                                                                                      |
| `Profile`                             | select           | yes, reused | From `formName` via `getProfileForForm`; options are the three profile labels                                                                                                       |
| `Mvmt Organization`                   | text             | yes, added  | From `affiliatedOrgs`, written verbatim (clamped to 2000 chars) rather than into the curated `Organization` select, which intake does not write; omitted if empty                   |
| `Website`                             | url              | yes, reused | First entry of `website[]`                                                                                                                                                          |
| `Website 2`                           | url              | yes, added  | Second entry of `website[]`; omitted if absent                                                                                                                                      |
| `Website 3`                           | url              | yes, added  | Third entry; omitted if absent                                                                                                                                                      |
| `Website 4`                           | url              | yes, added  | Fourth entry; omitted if absent                                                                                                                                                     |
| `Website 5`                           | url              | yes, added  | Fifth entry; omitted if absent. The form caps the field at 5 rows (`MAX_WEBSITE_ROWS`)                                                                                              |
| `Phone or Social Handle`              | phone_number     | yes, reused | `chat[]` + `chatService[]` joined as `handle (Service) \| ...`                                                                                                                      |
| `Mvmt Status`                         | select           | yes, reused | Always `New Lead` on intake; other options include `Active`, `Onboarding`, `Approved`, `Redirected - Post Call`, `No Show`, `Call Scheduled`, `Redirected`, `Eligible`, `One Pager` |
| `BU`                                  | multi_select     | yes, reused | Always `Movement`; other options: `IR`, `Comms`, `Ecodev`                                                                                                                           |
| `Added`                               | created_time     | auto        | Set by Notion on row creation; not written by intake                                                                                                                                |
| `City`                                | rich_text        | yes, added  | From `city`; omitted if empty                                                                                                                                                       |
| `Country`                             | rich_text        | yes, added  | From `country` (id mapped via `COUNTRY_MAP`; unknown ids written as-is)                                                                                                             |
| `Skills`                              | multi_select     | yes, added  | From `skills[]` (ids mapped via `SKILLS_MAP`; unknown ids written as-is); options: see shared values                                                                                |
| `Background`                          | rich_text        | yes, added  | First non-empty of `backgroundPartner`, `backgroundBuilder`, `backgroundLeader`                                                                                                     |
| `Tech Vision`                         | rich_text        | yes, added  | From `techVision`; Activist Builder only                                                                                                                                            |
| `Activities Vision`                   | rich_text        | yes, added  | From `activitiesVision`; Activist Leader / Steward only                                                                                                                             |
| `Questions`                           | rich_text        | yes, added  | From `questions`; omitted if empty                                                                                                                                                  |
| `Wants Events`                        | checkbox         | yes, added  | From `wantsEvents`                                                                                                                                                                  |
| `Wants Newsletter`                    | checkbox         | yes, added  | From `wantsNewsletter`                                                                                                                                                              |
| `How did you first hear about Logos?` | select           | yes, added  | From `hearAbout` (id mapped via `HEAR_ABOUT_MAP`); unknown ids are dropped so tampering cannot create new options; options: see shared values                                       |
| `Account Owner`                       | person           | no          | BD team member assigned to the row                                                                                                                                                  |
| `Contacts`                            | rich_text        | no          | Free-form contact notes                                                                                                                                                             |
| `Event Touchpoints`                   | multi_select     | no          | Options: `EthCC 2025`, `Protocolberg 2025`, `EthDenver 2025`, `EthDam`, `ETHCC`, `Inbound`, `Devcon 2024`, `Decentralized Data Summit`, `Devconnect 2025`                           |
| `Last Contact`                        | date             | no          | Date of most recent BD interaction                                                                                                                                                  |
| `Last edited time`                    | last_edited_time | no          | System-managed                                                                                                                                                                      |
| `Nimbus Status`                       | status           | no          | Options: `Not started`, `In progress`, `Done`                                                                                                                                       |
| `Platform`                            | multi_select     | no          | Options: `JS Browser`, `JS Electron`, `NodeJS`, `Rust`, `Golang`, `C++`                                                                                                             |
| `Priority`                            | select           | no          | Options: `Low`, `Medium`, `High`, `To be established`                                                                                                                               |
| `Segment`                             | multi_select     | no          | Options: `Social`, `Infrastructure`, `Cross-chain`, `L2`, `Studio`, `DeFi`, `Tooling`, `Nodes`, `AI`, `Wallets`, `Investor`, `Oracle`, `indexer`                                    |
| `Stack`                               | multi_select     | no          | Options: `Nimbus`, `Logos Storage`, `Logos Messaging`, `Logos Blockchain`                                                                                                           |
| `Status`                              | select           | no          | Options: `Lead`, `Qualified`, `Solution Eng`, `Preliminary interest`, `Confirmed`, `Future`, `Negotiation`, `Lost`, `Archive`                                                       |
| `Tags`                                | multi_select     | no          | Options include `Wallet dapp SDK user`, `Chat SDK user`, `Potential Waku users`, `Grant Recipient`, `Operator`, and others                                                          |
| `Total Funding`                       | number           | no          | Funding amount in USD                                                                                                                                                               |
| `User Persona Type`                   | multi_select     | no          | Options include `Node Operator`, `Developer`, `Integrator`, `Partner`, `Investor`, `Community`, and others                                                                          |
| `Waku Solution Engineers`             | person           | no          | Waku team member assigned to the row                                                                                                                                                |

### How the intake columns were added

Thirteen columns were added for funnel intake via `notion-update-data-source`
DDL; the pre-existing properties were left as they were, except that the
pre-existing `Website` url column now receives the first submitted website
instead of the old pipe-joined string. On 2026-07-06 one more column was added to
the production database (database `5b951a531bd94db9b0078e11640e1051`, data source
`9fe0dc96-98dc-493b-8e09-37c17f020872`) for logos-web#90:

    ADD COLUMN "How did you first hear about Logos?" SELECT('Friend or colleague','Social media','Search engine','Event or conference','Another community or organization','Podcast','News/article/blog','Other')

"Hide when empty" per property cannot be set via the Notion API or MCP. It must
be toggled manually in the Notion UI for each added property, including
`Website 2` to `Website 5`.

## Newsletter opt-ins

After the intake POST succeeds, `apps/web` fires the newsletter opt-ins the
visitor ticked. Each one subscribes the submitted email to a Ghost newsletter via
`admin-acid.logos.co` and attaches a note to the member profile.

| Checkbox                                        | `formKey`         | Newsletter          | Ghost id                   |
| ----------------------------------------------- | ----------------- | ------------------- | -------------------------- |
| "I want to receive the Logos Newsletter"        | `wantsNewsletter` | Logos Newsletter    | `6913441fee2f120001cec90d` |
| "I want to be informed about events in my city" | `wantsEvents`     | Regional Newsletter | `6a672fa7d5b09400014fffa1` |

`<profile>` in the note is the same string the Notion `Profile` select gets, via
`getProfileForForm`. `country` arrives as a numeric option id and is resolved to
its label against the form's own options before it reaches the note; an
unresolvable id is dropped. The Regional request also sends the resolved `city`
and `country` as top-level fields alongside the note, because the upstream builds
its city labels from those fields, never from the note.

Each subscription forwards the submitted answers (the form values plus
`formName`) flattened into the request body as top-level fields. The captcha token
stays out; it is intake plumbing. Nothing here allowlists individual fields, so a
new form field needs no change in `apps/web`. Select values are sent as their
label, not the id (`toLabelledFormFields`), because the subscribe endpoint has no
access to the option lists. Ids that resolve to nothing are dropped. Text fields
and checkboxes pass through untouched, and the resolved keys (`email`, `type`,
`newsletter`, `note`, plus `city` and `country` on the Regional request) are
written last so a same-named form field cannot overwrite them.

Three constraints shape it:

- **Client-side.** `apps/web` is a static export, so there is no route to proxy
  through, same as the footer signup. `admin-acid.logos.co` allowlists
  Logos-owned origins for CORS, so these calls always fail on `localhost`; unit
  tests are the verification.
- **Never throws.** It runs after the intake POST has already succeeded and its
  captcha token is spent, so a subscription failure is swallowed and logged
  rather than surfaced. Otherwise a successful submission would render as a
  network error, including on every local submit.
- **Sequential, Logos first.** The upstream folds the note into the member's
  existing note with a read-modify-write against the Ghost admin API, so firing
  both concurrently races that read and loses one note.

| Path                                       | Role                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `apps/web/lib/funnel-newsletter-signup.ts` | Builds the notes, fires the subscriptions                                               |
| `apps/web/lib/newsletter-signup.ts`        | Shared transport; `NEWSLETTER_IDS`, optional verbatim `note`, `formFields` pass-through |

## One pager upload

Setting a candidate's `Mvmt Status` to `One Pager` emails them a link to
`logos.co/one-pager`. They attach a PDF there, and it lands as a file block on
their own Notion page.

Everything server-side lives in admin-acid (`admin-acid.logos.co`): it owns the
funnel webhook, the email templates, the SMTP transport and a Notion client, and
`apps/web` is a static export with no API routes. This repo holds the page and its
transport only. For the token format, the upload endpoint and the Notion write
path, read admin-acid.

```
Notion: Mvmt Status -> "One Pager"
  -> automation emails the candidate a signed link

candidate opens logos.co/one-pager?t=<signed token>          (this repo)
  -> GET  admin-acid /api/funnel/one-pager?t=...  -> { valid, used }
  -> POST admin-acid /api/funnel/one-pager        (multipart: token + file)
       -> admin-acid validates, writes to Notion, notifies the reviewers
```

The two facts from that side the page has to render: the link expires, and it is
good for a single upload. Both are enforced upstream; this side only reports
them.

### Page states

| State                                  | Reached by                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Missing link                           | `/one-pager` opened with no `?t=`                                                                                               |
| No longer valid                        | `GET` answered `valid: false`: a forged or expired token; the upstream cannot tell them apart, so there is one message for both |
| Already submitted                      | `GET` answered `used: true`, or the `POST` 409'd and the follow-up status check confirmed the slot is spent                     |
| Checking / ready / uploading / success | the normal path                                                                                                                 |
| Error                                  | any other non-2xx; the upstream's own message is shown verbatim                                                                 |

A failed status check resolves to `unknown` and falls through to the ready state
rather than to "no longer valid". The check can fail transiently, and is blocked
outright by CORS unless the page is served from a Logos-owned origin; the `POST`
is the authority.

### Constraints

- **Client-side, cross-origin.** Same shape as the newsletter signup: a static
  export posting straight at `admin-acid.logos.co`, which allowlists Logos-owned
  origins. A page served from `localhost` therefore reaches only a local admin
  run with `IS_DEV_ENV=true` (`ONE_PAGER_ENDPOINTS.development` points at
  `localhost:3003`); against the deployed hosts, unit tests are the verification.
- **No preflight.** The `GET` is safelisted, and the `POST` sends
  `multipart/form-data` with the token as a form field rather than a header.
  Moving the token to an `Authorization` header would need a change to the
  upstream's CORS allowlist.
- **`useSearchParams` needs a `<Suspense>` boundary** above it or the static
  export build fails. The page provides one; the section is the only client
  component.
- **The page-count rule is not enforced here.** A one pager must be two pages or
  fewer, checked upstream only. This side checks type and size, and
  `ONE_PAGER_MAX_BYTES` is kept equal to the upstream constant of the same name.
- **The route is unlisted.** `noindex` metadata and no sitemap entry: without the
  emailed token the page can do nothing.

| Path                                                             | Role                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/web/app/[locale]/one-pager/page.tsx`                       | Route, `noindex` metadata, the `<Suspense>` boundary                             |
| `apps/web/app/[locale]/one-pager/_sections/one-pager-upload.tsx` | The client flow and every state above                                            |
| `apps/web/lib/one-pager-upload.ts`                               | `ONE_PAGER_ENDPOINTS`, the status check, the upload, the client-side file checks |
| `apps/web/messages/en.json` (`pages.onePager`)                   | All page copy                                                                    |

## Testing

- Endpoint behaviour: `apps/api/src/app/api/public/afform-submit/__tests__/route.test.ts`
- Notion property mapping: `apps/api/src/lib/notion/__tests__/build-notion-properties.test.ts`
- n8n payload: `apps/api/src/lib/n8n/__tests__/build-payload.test.ts`
- Endpoint agrees with the form schema: `apps/web/lib/funnel-forms/__tests__/required-fields-parity.test.ts`
- Newsletter opt-ins: `apps/web/lib/__tests__/funnel-newsletter-signup.test.ts`
- Subscribe payload: `apps/web/lib/__tests__/newsletter-signup.test.ts`
- One pager: `apps/web/lib/__tests__/one-pager-upload.test.ts` and `apps/web/app/__tests__/one-pager-page-contract.test.ts`

Run with `pnpm --filter api test` and `pnpm --filter web test`.
