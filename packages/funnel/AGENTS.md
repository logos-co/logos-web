# AGENTS.md

Rules for agents working in `packages/funnel` (`@repo/funnel`). The root
`AGENTS.md` also applies.

## Role

Single source of truth for the funnel values shared by `apps/web` and `apps/api`:
the hear-about question and options, the per-form profile label, the shared
option lists and the required-field list. Pure constants and helpers only; no
I/O, no React, no runtime dependency on either consumer.

## Commands

    pnpm --filter @repo/funnel lint
    pnpm --filter @repo/funnel check-types

## Rules

- Export everything through `src/index.ts`, the package entry point
  (`"exports": { ".": "./src/index.ts" }`). Do not add new entry points.
- `src/index.ts` re-exports `./required-fields` and `./form-options`; keep that
  shape. Do not import `./index` from `./required-fields` or `./form-options`,
  or you create a cycle.
- `src/form-options.ts` holds the option lists the three forms share and the id
  to label maps derived from them. `src/required-fields.ts` holds the
  required-field list. `src/index.ts` holds the hear-about values and the profile
  label.
- The option ids here must match the option values in the form definitions under
  `apps/web/lib/funnel-forms/`. Change one and you change the other in the same
  PR.
- `HEAR_ABOUT_QUESTION` doubles as the Notion select property name, and the
  `HEAR_ABOUT_OPTIONS` and `SKILLS_OPTIONS` labels double as the Notion select or
  multi_select options. Renaming any of them requires renaming the property or
  option in Notion first; see [docs/funnel/README.md](../../docs/funnel/README.md).
- `PROFILE_BY_FORM_NAME` values are the Notion `Profile` select options. Renaming
  one requires renaming the option in Notion first.
- `REQUIRED_FIELDS_BY_FORM` is the only place a funnel field is marked required.
  `apps/web` builds its zod schema from it and `apps/api` validates against it.
  Do not add a `required` flag to the per-form definitions in `apps/web`.

## Caveats

- `findInvalidRequiredFields` uses a looser email pattern than the client's zod
  `.email()` on purpose, so the endpoint never rejects what the form accepted.
- `getProfileForForm` and `getRequiredFieldsForForm` return `undefined` or an
  empty list for unknown form names; that is deliberate, not a fallback to add.

## Docs

- [../../docs/funnel/README.md](../../docs/funnel/README.md): the end-to-end flow,
  Notion schema and option maps
- [README.md](README.md): the export list and consumers
