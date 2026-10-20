# Self-hosted fonts

Commercial / non-Google fonts live here. They are not committed — drop the files locally and keep them out of git via `.gitignore` (or commit after license allows).

## Required files

### Rhymes Display

Consumed by `apps/web/app/fonts.ts` via `next/font/local`.

```
public/fonts/rhymes-display/
└── rhymes-display-regular.woff2   ← weight 400, style normal
```

- **Source**: Figma specifies "Rhymes Display Regular" for Hero, H1, H2, H3/H4 Serif, Subhead Serif, Body Serif.
- **Usage in code**: referenced as `var(--font-display)` through `@acid-info/logos-tokens/typography.css` utilities (`text-hero`, `text-h1`, …).
- **License**: verify with the brand owner before committing the woff2. The repo expects the file at dev time — `pnpm dev` will fail with a clear "file not found" error until the file is in place.

### Additional weights (future)

If the brand adopts italic or non-400 weights, add entries to `src[]` in `apps/web/app/fonts.ts`:

```ts
src: [
  { path: './rhymes-display/rhymes-display-regular.woff2', weight: '400', style: 'normal' },
  { path: './rhymes-display/rhymes-display-italic.woff2',  weight: '400', style: 'italic' },
]
```

## Google-hosted fonts

These do **not** belong here — they are loaded via `next/font/google` in `apps/web/app/fonts.ts`:

- Public Sans (400/500/600/700)
- Fira Code (400/500)
