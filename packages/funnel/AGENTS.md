# packages/funnel

Rules for agents working in `packages/funnel` (`@repo/funnel`). The root
`AGENTS.md` also applies.

## Role

Holds the funnel values `apps/web` and `apps/api` share: the hear-about question
and options, the per-form profile label, the shared option lists and the
required-field list. Constants and pure helpers only; no I/O, no React, no
runtime dependency on either consumer.

## Commands

    pnpm --filter @repo/funnel lint
    pnpm --filter @repo/funnel check-types

## Rules

- Export through `src/index.ts` (`"exports": { ".": "./src/index.ts" }`). Do not
  add entry points.
- `src/index.ts` holds the hear-about values and the profile label and
  re-exports `./required-fields` and `./form-options`. Do not import `./index`
  from those two modules; that is a cycle.
- `src/form-options.ts` holds the option lists the three forms share and the id
  to label maps derived from them. `src/required-fields.ts` holds the
  required-field list.
- Option ids must match the option values in the form definitions under
  `apps/web/lib/funnel-forms/`. Change both in the same PR.
- `HEAR_ABOUT_QUESTION` doubles as the name of the Notion select property and
  the `HEAR_ABOUT_OPTIONS` labels are its options; `SKILLS_OPTIONS` labels are
  the options of the `Skills` multi_select and `PROFILE_BY_FORM_NAME` values are
  the `Profile` select options. Rename in Notion first, then here; see
  [docs/funnel/README.md](../../docs/funnel/README.md).
- `REQUIRED_FIELDS_BY_FORM` is the only place a funnel field is marked required.
  `apps/web` builds its zod schema from it and `apps/api` validates against it.
  Do not add a `required` flag to the per-form definitions in `apps/web`.

## Caveats

- `findInvalidRequiredFields` uses a looser email pattern than the client's zod
  `.email()` on purpose, so the endpoint never rejects what the form accepted.
- `getProfileForForm` and `getRequiredFieldsForForm` return `undefined` or an
  empty list for an unknown form name. That is deliberate; do not add a
  fallback.

## Docs

- [../../docs/funnel/README.md](../../docs/funnel/README.md): the end-to-end
  flow, Notion schema and option maps
- [README.md](README.md): the export list and consumers
