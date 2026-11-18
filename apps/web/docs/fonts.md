# Self-hosted fonts

Which fonts [`app/fonts.ts`](../app/fonts.ts) loads, which files are committed, and how the root [`.gitignore`](../../../.gitignore) decides what goes into the repo.

## Rhymes Display

Rhymes Display regular (`public/fonts/rhymes-display/rhymes-display-regular.woff2`, weight 400, normal style) is the one commercial font committed, and its license was verified.

[`app/fonts.ts`](../app/fonts.ts) loads it with `next/font/local` and exposes it as `var(--next-font-display)`. The typography utilities in [`packages/tokens/src/typography.css`](../../../packages/tokens/src/typography.css) (`text-hero`, `text-h1` and the rest) read `--font-display`, which resolves through `var(--next-font-display)`.

## Gitignore rules

The root `.gitignore` ignores `*.woff`, `*.woff2`, `*.ttf` and `*.otf` under `apps/*/public/fonts`, then re-includes `apps/*/public/fonts/rhymes-display/*.woff2` because the license is verified and Vercel builds need the file. It also re-includes the four OFL font directories listed below.

To add a self-hosted font, verify the license with the brand owner first, add a re-include rule for it and commit the file.

## Google fonts

These Google Fonts families are self-hosted. [`scripts/generate-fonts.ts`](../scripts/generate-fonts.ts) generates their `next/font/local` loaders in [`app/google-fonts.ts`](../app/google-fonts.ts):

| Family      | Weights            | Directory                   | Variable                                          |
| ----------- | ------------------ | --------------------------- | ------------------------------------------------- |
| Public Sans | 400, 500, 600, 700 | `public/fonts/public-sans/` | `--next-font-sans`                                |
| Open Sans   | 400                | `public/fonts/open-sans/`   | `--next-font-article`                             |
| Fira Code   | 400, 500, 600      | `public/fonts/fira-code/`   | `--next-font-mono`, `--developer-programmes-mono` |
| Fira Mono   | 400, 700           | `public/fonts/fira-mono/`   | `--next-font-mono-body`                           |

All four are under the SIL Open Font License; each directory ships its `OFL.txt`.

We don't use `next/font/google` because it downloads the fonts during `next build`. Google Fonts sometimes answers with extensionless `/l/font?kit=` URLs, which crash the webpack loader with `TypeError: Cannot read properties of null (reading '1')` and fail CI at random ([vercel/next.js#99114](https://github.com/vercel/next.js/issues/99114)).

The committed files are the ones `next/font/google` served: the generator asks the Google Fonts CSS API for the weights above and downloads every unicode-range subset it returns (Latin, Latin Extended, Cyrillic, Greek, Vietnamese and so on). Each subset gets its own loader under the Google family name (`'Public Sans'`, not a generated one), so the browser merges them into one family and only downloads a subset when a page uses one of its characters. Only the Latin files are preloaded. The size-adjusted Arial fallbacks in [`app/google-fonts-fallback.css`](../app/google-fonts-fallback.css) use the same metrics as `next/font/google`.

To change weights or refresh the files, edit `FAMILIES` in the generator, run `pnpm --filter web generate:fonts` and commit the regenerated files.

The web build uses `next build --webpack` because the Turbopack Google font
loader failed to resolve Fira Code during deployment. No font comes from Google
at build time any more, so once a normal Turbopack build succeeds, remove
`--webpack` from `build:app` in [`package.json`](../package.json).
