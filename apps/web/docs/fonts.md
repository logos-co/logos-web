# Self-hosted fonts

Which fonts [`app/fonts.ts`](../app/fonts.ts) loads, which files are committed, and how the root [`.gitignore`](../../../.gitignore) decides what goes into the repo.

## Rhymes Display

Rhymes Display regular (`public/fonts/rhymes-display/rhymes-display-regular.woff2`, weight 400, normal style) is the one commercial font committed, and its license was verified.

[`app/fonts.ts`](../app/fonts.ts) loads it with `next/font/local` and exposes it as `var(--next-font-display)`. The typography utilities in [`packages/tokens/src/typography.css`](../../../packages/tokens/src/typography.css) (`text-hero`, `text-h1` and the rest) read `--font-display`, which resolves through `var(--next-font-display)`.

## Gitignore rules

The root `.gitignore` ignores `*.woff`, `*.woff2`, `*.ttf` and `*.otf` under `apps/*/public/fonts`, then re-includes `apps/*/public/fonts/rhymes-display/*.woff2` because the license is verified and Vercel builds need the file. It also re-includes the four OFL font directories listed below.

To add a self-hosted font, verify the license with the brand owner first, add a re-include rule for it and commit the file.

## Google fonts

These Google Fonts families are self-hosted with `next/font/local`:

| Family      | Weights            | File                                        | Variable                                          |
| ----------- | ------------------ | ------------------------------------------- | ------------------------------------------------- |
| Public Sans | 400-700 (variable) | `public-sans/public-sans-latin-wght.woff2`  | `--next-font-sans`                                |
| Open Sans   | 400                | `open-sans/open-sans-latin-400.woff2`       | `--next-font-article`                             |
| Fira Code   | 400-600 (variable) | `fira-code/fira-code-latin-wght.woff2`      | `--next-font-mono`, `--developer-programmes-mono` |
| Fira Mono   | 400, 700           | `fira-mono/fira-mono-latin-{400,700}.woff2` | `--next-font-mono-body`                           |

All four are under the SIL Open Font License; each directory ships its `OFL.txt`.

We don't use `next/font/google` because it downloads the fonts during `next build`. Google Fonts sometimes answers with extensionless `/l/font?kit=` URLs, which crash the webpack loader with `TypeError: Cannot read properties of null (reading '1')` and fail CI at random ([vercel/next.js#99114](https://github.com/vercel/next.js/issues/99114)).

The files only cover Latin and Latin Extended (the `latin` and `latin-ext` unicode ranges Google Fonts uses). Characters from other scripts, such as Cyrillic or Greek, render in the fallback font.

To change weights or update the fonts, edit [`scripts/generate-fonts.sh`](../scripts/generate-fonts.sh) and run `pnpm --filter web generate:fonts`. It downloads the sources from a pinned `google/fonts` commit, trims the weight axes and subsets them with `fonttools` (needs `uv`). Then update the loaders in [`app/fonts.ts`](../app/fonts.ts) and commit the regenerated files.

The web build uses `next build --webpack` because the Turbopack Google font
loader failed to resolve Fira Code during deployment. No font comes from Google
at build time any more, so once a normal Turbopack build succeeds, remove
`--webpack` from `build:app` in [`package.json`](../package.json).
