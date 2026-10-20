# @repo/funnel

Shared constants and helpers for the funnel forms, consumed by both `apps/web`
and `apps/api`. Private workspace package; not published.

## What it exports

- `HEAR_ABOUT_QUESTION`, `HEAR_ABOUT_OPTIONS`, `HEAR_ABOUT_MAP`: the "How did you
  first hear about Logos?" question, its options and the id to label map
- `PROFILE_BY_FORM_NAME`, `getProfileForForm`: the Notion `Profile` label per form
- `SKILLS_OPTIONS`, `CHAT_SERVICE_OPTIONS`, `COUNTRY_OPTIONS` and their `*_MAP`
  id to label maps
- `REQUIRED_FIELDS_BY_FORM`, `getRequiredFieldsForForm`,
  `findInvalidRequiredFields`

## Consumers

- `apps/web`: renders the form fields and options and builds the zod schema from
  `REQUIRED_FIELDS_BY_FORM`
- `apps/api`: resolves submitted option ids back to labels and validates the
  required fields

## Commands

    pnpm --filter @repo/funnel lint
    pnpm --filter @repo/funnel check-types

## More

- [Funnel reference](../../docs/funnel/README.md)
- [Agent guide](AGENTS.md)
