# @repo/funnel

The funnel values that `apps/web` and `apps/api` have to agree on: the
hear-about question and its options, the profile label per form, the option
lists all three forms share, and the required fields per form. Constants and
pure helpers only, with no I/O and no React. A private workspace package
(`private: true`), imported as `@repo/funnel`; nothing is published.

## Exports

`src/index.ts` is the only entry point and everything below comes through it.

- `HEAR_ABOUT_QUESTION`, `HEAR_ABOUT_OPTIONS`, `HEAR_ABOUT_MAP`: the "How did
  you first hear about Logos?" question, its eight options and the id to label
  map
- `PROFILE_BY_FORM_NAME`, `getProfileForForm`: the Notion `Profile` label per
  form, such as `Coalition Partner`
- `SKILLS_OPTIONS`, `CHAT_SERVICE_OPTIONS`, `COUNTRY_OPTIONS` and the matching
  `SKILLS_MAP`, `CHAT_SERVICE_MAP`, `COUNTRY_MAP` id to label maps
- `REQUIRED_FIELDS_BY_FORM`, `getRequiredFieldsForForm`,
  `findInvalidRequiredFields`

`apps/web` renders the form fields and options from these values and builds its
zod schema from `REQUIRED_FIELDS_BY_FORM`; `apps/api` resolves submitted option
ids back to labels and validates the required fields against the same list.

## Changing a value

Option ids here must match the option values in the form definitions under
`apps/web/lib/funnel-forms/`, so a rename touches both. Some labels are also
Notion property or select-option names, which have to be renamed in Notion
first. [AGENTS.md](AGENTS.md) has the rules and
[docs/funnel/README.md](../../docs/funnel/README.md) has the option lists and
the Notion schema.

## Commands

    pnpm --filter @repo/funnel lint
    pnpm --filter @repo/funnel check-types

The package has no tests of its own. `apps/web/lib/funnel-forms/__tests__/required-fields-parity.test.ts`
is what keeps it in step with the form definitions.
