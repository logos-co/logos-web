# Pulling a CiviCRM Afform into logos-web

Goal: use forms built in CiviCRM (FormBuilder/Afform) at **https://civicrm.logos.co**, get fields and types via API, render them in `apps/web`, and submit through `apps/civi-crm` so the same CiviCRM automations run.

## Layout in this monorepo

| Path | Purpose |
| --- | --- |
| `apps/web/lib/civicrm/afform-*.ts` | Generated form configs consumed by connect pages |
| `apps/web/lib/civicrm/connect-fallbacks.json` | Known option group IDs + fallback select options |
| `apps/web/scripts/fetch-afform-contact-form.mjs` | Pull Afform layout from CiviCRM and regenerate configs |
| `apps/web/scripts/generate-civicrm-connect-fields.mjs` | Refresh option fallbacks from CiviCRM field metadata |
| `apps/web/scripts/civicrm-discovery.json` | Postman/Insomnia collection for probing the API |
| `apps/civi-crm/src/app/api/public/contact` | Direct Contact + Case creation (`/connect`) |
| `apps/civi-crm/src/app/api/public/afform-submit` | `Afform.submit` for activist/coalition forms |

## Is it possible?

**Partly.** You can:

- **List forms** and get metadata via `Afform::get`.
- **Submit in a way that triggers server-side behavior** via `Afform::submit`.
- **Discover fields** only to the extent the API exposes layout/definition on `Afform::get`.

If layout is missing from the API response, keep the generated mapping in `lib/civicrm/` or re-run the fetch script after permission changes.

---

## Regenerating form configs

Requires `CIVICRM_BASE_URL` + `CIVICRM_API_KEY` in `apps/civi-crm/.env.local` (or `apps/web/.env.local`).

From `apps/web`:

```bash
pnpm fetch:afform-contact              # afformCircleContactForm → lib/civicrm/afform-circle-contact-form.ts
pnpm fetch:afform-activist-builder
pnpm fetch:afform-activist-leader
pnpm fetch:afform-coalition-partner
pnpm fetch:afform-all                  # all four
pnpm fetch:afform-contact:dry-run      # API call, no writes
```

The fetch script:

1. Calls **Afform.get** for the named form and parses `layout`.
2. Resolves select options (role, skills, chat service, country) via CustomField / OptionValue / Country APIs.
3. Writes **`lib/civicrm/afform-<slug>.ts`** with `AFFORM`, `AFFORM_OPTIONS`, page copy exports.
4. Updates **`lib/civicrm/connect-fallbacks.json`** when option lists change.

Refresh fallbacks only (option groups, no layout):

```bash
pnpm generate:civicrm-fields
```

---

## Submit paths

| Form | Frontend route | Backend |
| --- | --- | --- |
| Contact / Connect | `/connect` | `POST /api/public/contact` — creates Contact + Case directly |
| Activist Builder | `/activist-builder` | `POST /api/public/afform-submit` |
| Activist Leader / Steward | `/activist-leader-steward` | `POST /api/public/afform-submit` |
| Coalition Partner | `/coalition-partner` | `POST /api/public/afform-submit` |

On afform intake submissions, `apps/civi-crm` injects **Case1** defaults server-side (`Circle_Case.Profile` and `Circle_Case.Lead_Source`) from `src/lib/civicrm/afform-case-defaults.ts`. Clients cannot override these values.

Set `NEXT_PUBLIC_CIVI_CRM_URL` in `apps/web/.env.local` to the civi-crm app origin (e.g. `http://localhost:3012` locally).

---

## API discovery

Import **`apps/web/scripts/civicrm-discovery.json`** into Postman or Insomnia. Section **8. Afform (FormBuilder)** covers list/get/submit probes against `https://civicrm.logos.co`.

---

## API key permissions (minimal)

For fetch + public form submit keys:

- `access CiviCRM`
- `access AJAX API`

Afform read/submit may require additional permissions on some instances — test with a dedicated contact + role before production use.

See the original logos repo doc for full Afform.submit payload notes and permission troubleshooting.
