# Self-hosted fonts

Which fonts [`app/fonts.ts`](../app/fonts.ts) loads, which files are committed, and how the root [`.gitignore`](../../../.gitignore) decides what goes into the repo.

## Rhymes Display

Rhymes Display regular (`public/fonts/rhymes-display/rhymes-display-regular.woff2`, weight 400, normal style) is the one commercial font committed, and its license was verified.

[`app/fonts.ts`](../app/fonts.ts) loads it with `next/font/local` and exposes it as `var(--next-font-display)`. The typography utilities in [`packages/tokens/src/typography.css`](../../../packages/tokens/src/typography.css) (`text-hero`, `text-h1` and the rest) read `--font-display`, which resolves through `var(--next-font-display)`.

## Gitignore rules

The root `.gitignore` ignores `*.woff`, `*.woff2`, `*.ttf` and `*.otf` under `apps/*/public/fonts`, then re-includes `apps/*/public/fonts/rhymes-display/*.woff2` because the license is verified and Vercel builds need the file.

To add a self-hosted font, verify the license with the brand owner first, add a re-include rule for it and commit the file.

## Google fonts

[`app/fonts.ts`](../app/fonts.ts) loads these with `next/font/google` rather than self-hosting:

- Public Sans (400/500/600/700), `--next-font-sans`
- Open Sans (400), `--next-font-article`
- Fira Code (400/500), `--next-font-mono`
- Fira Mono (400/700), `--next-font-mono-body`
