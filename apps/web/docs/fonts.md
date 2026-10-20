# Self-hosted fonts

Which fonts are committed, which are ignored, and how `apps/web/app/fonts.ts`
loads them. This file lives in `docs/` and is not served publicly.

## Rhymes Display

One commercial font is committed, with the license verified:

- `public/fonts/rhymes-display/rhymes-display-regular.woff2` (weight 400,
  style normal)

[`app/fonts.ts`](../app/fonts.ts) loads it with `next/font/local` and exposes it
as `var(--next-font-display)`, which the `@acid-info/logos-tokens` typography
utilities (`text-hero`, `text-h1`, and so on) reference.

## Gitignore rules

The root [`.gitignore`](../../../.gitignore) ignores every font file under
`apps/*/public/fonts`:

- `*.woff`, `*.woff2`, `*.ttf` and `*.otf` are ignored.
- `README.md` files under `public/fonts` are kept.
- `apps/*/public/fonts/rhymes-display/*.woff2` is re-included, with a note that
  the license is verified and the file is committed for Vercel builds.

To add a new self-hosted font, commit the file and extend the re-include rule.
Verify the license with the brand owner before committing.

## Google fonts

Loaded in [`app/fonts.ts`](../app/fonts.ts) via `next/font/google`, not
self-hosted:

- Public Sans (400/500/600/700)
- Open Sans (400)
- Fira Code (400/500)
- Fira Mono (400/700)
