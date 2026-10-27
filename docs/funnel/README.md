# Funnel intake

The three funnel forms on `apps/web` post to one endpoint on `apps/api`, which
writes each submission to Notion and forwards the steward form to an n8n/Baserow
webhook as well. This page follows a submission end to end and records the
Notion database schema and the option maps both sides share. The code is in
[`apps/api/src/app/api/public/afform-submit/route.ts`](../../apps/api/src/app/api/public/afform-submit/route.ts),
[`apps/web/lib/funnel-forms`](../../apps/web/lib/funnel-forms),
[`apps/web/lib/funnel-newsletter-signup.ts`](../../apps/web/lib/funnel-newsletter-signup.ts) and
[`packages/funnel/src`](../../packages/funnel/src). How the endpoint itself
validates, its env vars and CORS are in
[apps/api/docs/architecture.md](../../apps/api/docs/architecture.md).

## Forms

| Web page                   | `formName` in POST body       | Notion `Profile` value      |
| -------------------------- | ----------------------------- | --------------------------- |
| `/coalition-partner`       | `afformCoalitionPartner`      | `Coalition Partner`         |
| `/activist-builder`        | `afformActivistBuilder`       | `Activist Builder`          |
| `/activist-leader-steward` | `afformActivistLeaderSteward` | `Activist Leader / Steward` |

Both apps read the profile label through `getProfileForForm` in
`@repo/funnel`. `/contact` (`apps/web/app/[locale]/contact/page.tsx`) only
redirects to the home page and has no form, so the endpoint rejects any other
`formName`, including the old `afformCircleContactForm`.

## End to end flow

```
apps/web (static, ConnectFormSection)
  -> POST { formName, captchaToken, ...formFields }
apps/api
  POST /api/public/afform-submit
  -> validates, verifies hCaptcha, forwards to Notion and (steward only) n8n
```

hCaptcha tokens are single-use, so the browser makes one POST and the endpoint
does every write behind a single verification. That is why all three forms
share one handler. Once the POST succeeds, `apps/web` sends the
[newsletter opt-ins](#newsletter-opt-ins) on its own; they are not part of the
intake request.

## Shared values in @repo/funnel

`packages/funnel` (`@repo/funnel`) holds every value the form and the endpoint
must agree on, so a submitted id always resolves to the label the visitor
picked. The rules for changing them are in
[packages/funnel/AGENTS.md](../../packages/funnel/AGENTS.md) and
[apps/api/AGENTS.md](../../apps/api/AGENTS.md).

`src/index.ts` has `HEAR_ABOUT_QUESTION` and `HEAR_ABOUT_OPTIONS`, the "How did
you first hear about Logos?" question and its options, plus
`PROFILE_BY_FORM_NAME` and `getProfileForForm` for the table above. The question
string is also the name of the Notion select property and the labels are its
options, so to reword either you rename the property or option in Notion first.

`src/form-options.ts` has `SKILLS_OPTIONS`, `CHAT_SERVICE_OPTIONS` and
`COUNTRY_OPTIONS`, the dropdowns all three forms share. `apps/web` renders them
through `AFFORM_OPTIONS` (`lib/funnel-forms/afform-options.ts`). `apps/api`
turns ids back into labels with `SKILLS_MAP`, `CHAT_SERVICE_MAP`, `COUNTRY_MAP`
and `HEAR_ABOUT_MAP`, each built by `toLabelMap()` from the same array. The
`Skills` labels are also the options of the Notion `Skills` multi_select;
`Country` is rich text in Notion and accepts any label. Each country option is a
`FunnelCountryOption`: besides `value` and `label` it carries `code`, the
ISO 3166-1 alpha-2 code the logos-admin cities API uses, so a
[city suggestion](#city-suggestions) maps back to an option.

Skills options (16): `Developer`, `Web3 builder`, `Privacy domain expert`,
`Website developer`, `Product designer`, `Researcher`, `Activist`,
`Project manager`, `Community builder`, `Thought leader / Influencer`,
`Creative`, `Marketer`, `Fundraiser`, `Educator`, `Policy advocate`,
`Translator`.

Hear-about options (8): `Friend or colleague`, `Social media`, `Search engine`,
`Event or conference`, `Another community or organization`, `Podcast`,
`News/article/blog`, `Other`.

`src/required-fields.ts` has `REQUIRED_FIELDS_BY_FORM`, the only place a funnel
field is marked required. The form pages pass it to `ConnectFormSection`, which
builds the zod schema and the asterisks from it, and the endpoint rejects a
payload that misses any of the fields. The per-form definitions in
`apps/web/lib/funnel-forms/` describe rendering only and have no `required`
flag. The endpoint also checks that `email` looks like an address, with a
looser pattern than the client's zod `.email()` so it never rejects what the
form accepted.

## City suggestions

The `city` field in `ConnectFormSection` renders as `CityField`, which suggests
cities as the visitor types and stays free text otherwise. It is built on the
`useCityAutocomplete` hook from `@acid-info/logos-ui/client`; its debounce,
minimum length and keys are described with the
[footer newsletter form](../components.md#newsletter-form), which uses the same
hook.

Suggestions come from `searchCities` in `apps/web/lib/city-search.ts`. It calls
`GET /api/cities` on the logos-admin app with `q` and, when a country is
selected, `country` set to that option's ISO code. The static export ships no
city list, which is why this is a runtime call. `NEXT_PUBLIC_API_MODE` picks the
endpoint from `CITIES_ENDPOINTS`: `development` is `localhost:3003`, `staging`
is `dev-admin-acid.logos.co`, and `production`, the default, is
`admin-acid.logos.co`. Each result maps back to a `COUNTRY_OPTIONS` entry by its
`countryCode`. Results in a country the forms don't offer are dropped, because
they couldn't set the country, and same-name places in one country become one
suggestion. Any failure, CORS included, resolves to no suggestions.

The two adapters differ only in the country value they work with. The funnel
forms use `searchCitiesByCountryId`, because their country value is the option
id; the footer uses `searchCitiesByCountryLabel`, because it submits the label.
Picking a suggestion sets both `city` and `country`. Choosing a different country
afterwards clears a city that came from a suggestion, but keeps typed text.

## Code layout

| Path                                                       | Role                                                                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `apps/api/src/app/api/public/afform-submit/route.ts`       | Orchestrator: validation, captcha, calls the destination libs                        |
| `apps/api/src/lib/intake-submit-flags.ts`                  | Reads the `FUNNEL_INTAKE_NOTION_DISABLED` env flag                                   |
| `apps/api/src/lib/notion/maps.ts`                          | `MVMT_STATUS_NEW_LEAD`, `BU_MOVEMENT`; re-exports the `@repo/funnel` maps            |
| `apps/api/src/lib/notion/build-notion-properties.ts`       | `buildNotionProperties` and `resolveHearAboutLabel`                                  |
| `apps/api/src/lib/notion/constants.ts`                     | Notion API base URL, version, 2000 char text limit                                   |
| `apps/api/src/lib/notion/evaluation-template.ts`           | Evaluation template blocks attached to every new page                                |
| `apps/api/src/lib/notion/submit.ts`                        | `submitToNotion`: resolves the data source, builds properties, POSTs the page        |
| `apps/api/src/lib/n8n/build-payload.ts`                    | `buildN8nPayload`: merges id-based answers with their labels                         |
| `apps/api/src/lib/n8n/constants.ts`                        | `N8N_STEWARD_WEBHOOK_URL`                                                            |
| `apps/api/src/lib/n8n/submit.ts`                           | `submitToN8n`: steward webhook POST                                                  |
| `packages/funnel/src/index.ts`                             | `@repo/funnel` entry point; re-exports the modules below                             |
| `packages/funnel/src/form-options.ts`                      | The shared option lists and the maps derived from them                               |
| `packages/funnel/src/required-fields.ts`                   | `REQUIRED_FIELDS_BY_FORM` / `findInvalidRequiredFields`                              |
| `apps/web/lib/funnel-newsletter-signup.ts`                 | Post-submit Ghost newsletter opt-ins                                                 |
| `apps/web/lib/city-search.ts`                              | `CITIES_ENDPOINTS`, `searchCities` and the label and id country adapters             |
| `apps/web/components/sections/connect/form/city-field.tsx` | `CityField`: the city input and its suggestion list                                  |
| `apps/web/lib/funnel-forms/afform-*.ts`                    | Hand-maintained field definitions per form; rendering only                           |
| `apps/web/lib/funnel-forms/afform-options.ts`              | `AFFORM_OPTIONS`: the `@repo/funnel` option lists keyed by `formKey`                 |
| `apps/web/lib/funnel-forms/contactFormSchema.ts`           | Builds the zod schema from the form definition and the required list                 |
| `apps/web/lib/funnel-forms/hear-about-field.ts`            | Hear-about field def plus `withHearAboutField`, which inserts it after `chatService` |
| `apps/web/lib/funnel-forms/types.ts`                       | The `Afform*` shapes those files satisfy                                             |

The Notion and n8n libs share nothing except the id to label maps. To drop a
destination, delete its folder and its one call in the orchestrator.

## Notion database schema

Intake writes to the "IFT BD CRM" database. The table lists every property in
it. In the Funnel column, "reused" means intake writes a property the BD team
already had, "added" means the property was created for intake, and "no" means
the team maintains it by hand. The written rows are exactly what
`buildNotionProperties` produces.

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

The first thirteen intake columns went in through `notion-update-data-source`
DDL. The pre-existing properties kept their definitions; the only change on
that side is that `Website` now gets the first submitted website instead of
the old pipe-joined string. `Mvmt Organization` came later. On 2026-07-06 the
hear-about column was added to the production database (database
`5b951a531bd94db9b0078e11640e1051`, data source
`9fe0dc96-98dc-493b-8e09-37c17f020872`) for logos-web#90:

    ADD COLUMN "How did you first hear about Logos?" SELECT('Friend or colleague','Social media','Search engine','Event or conference','Another community or organization','Podcast','News/article/blog','Other')

Neither the Notion API nor the MCP can set "Hide when empty" on a property, so
someone has to toggle it in the Notion UI for each added property, `Website 2`
to `Website 5` included.

## Newsletter opt-ins

After the intake POST succeeds, `apps/web` subscribes the submitted email to
each Ghost newsletter the visitor ticked, through `admin-acid.logos.co`, and
attaches a note to the member profile.

| Checkbox                                        | `formKey`         | Newsletter          | Ghost id                   |
| ----------------------------------------------- | ----------------- | ------------------- | -------------------------- |
| "I want to receive the Logos Newsletter"        | `wantsNewsletter` | Logos Newsletter    | `6913441fee2f120001cec90d` |
| "I want to be informed about events in my city" | `wantsEvents`     | Regional Newsletter | `6a672fa7d5b09400014fffa1` |

The Logos note is a `Profile:` line; the Regional note has `City:`,
`Country:` and `Profile:` lines. The profile is the same string the Notion
`Profile` select gets, from `getProfileForForm`. `country` arrives as a numeric
option id and is resolved against the form's own options before it goes into
the note; an id that resolves to nothing is dropped. The Regional request also
sends `city` and `country` as top-level fields, because the upstream builds its
city labels from those fields and never reads the note. The upstream rejects a
Regional signup that is missing either of them; the footer signup
(`submitDefaultNewsletterSignup`) therefore adds the Regional Newsletter only
when both a city and a country were given.

Each request also carries the submitted answers (the form values plus
`formName`) as top-level fields, without the captcha token. There is no
per-field allowlist, so a new form field needs no change here. Select values
go out as labels (`toLabelledFormFields`) because the subscribe endpoint has no
access to the option lists, and unresolvable ids are dropped. Text fields and
checkboxes pass through unchanged. The resolved keys (`email`, `type`,
`newsletter`, `note`, plus `city` and `country` on the Regional request) are
written last, so a form field with the same name cannot overwrite them.

A few constraints explain the shape of this code:

- It runs in the browser. `apps/web` is a static export with no route to proxy
  through, the same as the footer signup. `admin-acid.logos.co` only allows
  Logos-owned origins through CORS, so these calls always fail on `localhost`
  and the unit tests are how you verify them.
- It never throws. By the time it runs, the intake POST has succeeded and spent
  its captcha token, so a failed subscription is logged and swallowed. Surfacing
  it would show a network error after a successful submission, and on every
  local submit.
- The two subscriptions run one after the other, Logos first. The upstream
  merges the note into the member's existing note with a read-modify-write
  against the Ghost admin API, and two concurrent calls race that read and lose
  one note.

| Path                                       | Role                                                                                    |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| `apps/web/lib/funnel-newsletter-signup.ts` | Builds the notes, fires the subscriptions                                               |
| `apps/web/lib/newsletter-signup.ts`        | Shared transport; `NEWSLETTER_IDS`, optional verbatim `note`, `formFields` pass-through |

## One pager upload

When someone sets a candidate's `Mvmt Status` to `One Pager`, the candidate gets
an email with a link to `logos.co/one-pager`. They attach a PDF there, and it
lands as a file block on their own Notion page.

All the server-side work happens in admin-acid (`admin-acid.logos.co`), which
owns the funnel webhook, the email templates, the SMTP transport and a Notion
client. `apps/web` is a static export with no API routes, so this repo has only
the page and its transport. Read admin-acid's
[docs/funnel.md](https://github.com/acid-info/admin-acid.logos.co/blob/develop/docs/funnel.md)
for the token format, the upload endpoint and the Notion write.

```
Notion: Mvmt Status -> "One Pager"
  -> automation emails the candidate a signed link

candidate opens logos.co/one-pager?t=<signed token>          (this repo)
  -> GET  admin-acid /api/funnel/one-pager?t=...  -> { valid, used }
  -> POST admin-acid /api/funnel/one-pager        (multipart: token + file)
       -> admin-acid validates, writes to Notion, notifies the reviewers
```

The link expires and is good for one upload. admin-acid enforces both; the page
only tells the candidate which case they hit.

### Page states

| State                                  | Reached by                                                                                                                      |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Missing link                           | `/one-pager` opened with no `?t=`                                                                                               |
| No longer valid                        | `GET` answered `valid: false`: a forged or expired token; the upstream cannot tell them apart, so there is one message for both |
| Already submitted                      | `GET` answered `used: true`, or the `POST` 409'd and the follow-up status check confirmed the slot is spent                     |
| Checking / ready / uploading / success | the normal path                                                                                                                 |
| Error                                  | any other non-2xx; the upstream's own message is shown verbatim                                                                 |

If the status check fails, it resolves to `unknown` and the page shows the
ready state, not "no longer valid". The check can fail transiently, and CORS
blocks it outright unless the page comes from a Logos-owned origin, so the
`POST` has the final say.

### Constraints

- The page calls admin-acid straight from the browser, like the newsletter
  signup, and admin-acid only allows Logos-owned origins. Served from
  `localhost`, the page can only reach a local admin run with `IS_DEV_ENV=true`
  (`ONE_PAGER_ENDPOINTS.development` points at `localhost:3003`). Against the
  deployed hosts, the unit tests are the verification.
- Neither request triggers a CORS preflight. The `GET` is safelisted, and the
  `POST` sends `multipart/form-data` with the token as a form field. Moving the
  token into an `Authorization` header would need a change to the upstream's
  CORS allowlist.
- `useSearchParams` needs a `<Suspense>` boundary above it, or the static export
  build fails. The page provides one, and the upload section is the only client
  component.
- A one pager must be two pages or fewer, and only admin-acid checks that. This
  side checks type and size, and `ONE_PAGER_MAX_BYTES` must stay equal to the
  upstream constant of the same name.
- The route is unlisted: it has `noindex` metadata and no sitemap entry, since
  the page does nothing without the emailed token.

| Path                                                             | Role                                                                             |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `apps/web/app/[locale]/one-pager/page.tsx`                       | Route, `noindex` metadata, the `<Suspense>` boundary                             |
| `apps/web/app/[locale]/one-pager/_sections/one-pager-upload.tsx` | The client flow and every state above                                            |
| `apps/web/lib/one-pager-upload.ts`                               | `ONE_PAGER_ENDPOINTS`, the status check, the upload, the client-side file checks |
| `apps/web/messages/en.json` (`pages.onePager`)                   | All page copy                                                                    |

## Testing

Run `pnpm --filter api test` and `pnpm --filter web test`. The tests that cover
the funnel:

| What                                 | Test file                                                                                                   |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Endpoint behaviour                   | `apps/api/src/app/api/public/afform-submit/__tests__/route.test.ts`                                         |
| Notion property mapping              | `apps/api/src/lib/notion/__tests__/build-notion-properties.test.ts`                                         |
| n8n payload                          | `apps/api/src/lib/n8n/__tests__/build-payload.test.ts`                                                      |
| Endpoint agrees with the form schema | `apps/web/lib/funnel-forms/__tests__/required-fields-parity.test.ts`                                        |
| Newsletter opt-ins                   | `apps/web/lib/__tests__/funnel-newsletter-signup.test.ts`                                                   |
| Subscribe payload                    | `apps/web/lib/__tests__/newsletter-signup.test.ts`                                                          |
| City search and country ISO codes    | `apps/web/lib/__tests__/city-search.test.ts`                                                                |
| City field in the funnel forms       | `apps/web/components/sections/connect/__tests__/connect-form-city.test.tsx`                                 |
| One pager                            | `apps/web/lib/__tests__/one-pager-upload.test.ts`, `apps/web/app/__tests__/one-pager-page-contract.test.ts` |
