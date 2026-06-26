# Visual

When we build an Artefact (a website, a tool, a dashboard, a hub) in the "As Logos" register, it should look like it belongs to the same family as [logos.co](https://logos.co/). Not identical but unmistakably the same system. One system covers everything: Artefacts, Comms (social cards, decks, printed matter), and print.

## The source

The system is authored in Figma. From it we generate one file that every surface imports:

```
logos-design/assets/tokens.css
```

Tokens are never hard coded: to change one, update Figma first, then regenerate tokens.css.

-   **Figma file**: `4Rsufbuu6KjR1cab3eq063`
-   **Guidelines file**: `logos-guidelines-figma` repo, components, frames, screenshots
-   **Design reference**: `logos-design` repo, colour, typography, marks, art direction, playground

It contains:

### Colour

| Token | Value | Use |
| --- | --- | --- |
| `--c-ink` | `#152521` | Default text, canvas ground (dark mode) |
| `--c-paper` | `#f5f5ef` | Background, foreground on dark |
| `--c-signal` | `#ffd328` | CTAs, highlights, interactive accent |
| `--c-slate` | `#475651` | Body text on paper |
| `--c-fog` | `#dbddd7` | Borders, dividers, soft neutral |
| `--c-grey` | `#848e88` | Secondary text, metadata |
| `--c-steel` | `#5f797c` | Links (hover), teal accent |
| `--c-moss` | `#616e69` | Dark green-grey, subtle UI |
| `--c-tan` | `#a18863` | Illustration, warm accent |
| `--c-rust` | `#6d3d30` | Deep warm accent |
| `--c-plum` | `#48373f` | Deep cool accent |

Use semantic aliases in components: `--bg`, `--fg`, `--fg-muted`, `--fg-subtle`, `--rule`, `--link`.

Dark theme inverts: ink becomes ground, paper becomes foreground. See `[data-theme="dark"]` in tokens.css.

### Typography

| Role | Family | Fallback |
| --- | --- | --- |
| Display headlines | Rhymes Display | Times New Roman, Times |
| Editorial body | Rhymes Text | Iowan Old Style, Georgia |
| UI / interface | Public Sans | Inter, system-ui |
| Callouts | Peclet | Public Sans |
| Code / data | Fira Mono / Fira Code | SF Mono, Menlo |

Use the `--font-*` tokens. Do not hard code font names.

### Grid

-   12 columns, 1440px frame
    -   Column: 102.67px
    -   Gutter: 16px
    -   Margin: 16px
-   Magazine editorial variant: 6 columns, 20px gap

### Spacing

4px base scale: `--sp-1` (4px) through `--sp-10` (128px).

## The visual test

Hold your product next to [logos.co](https://logos.co/). Then ask:

1.  **Same palette?** Only the tokens above, no colours outside them.
2.  **Same typeface?** Rhymes for editorial, Public Sans for UI, Fira for code.
3.  **Same density?** Tight tracking, generous white space, no cramped layouts.
4.  **Same feel?** Infrastructure, not consumer app. Tools, not toys. Manual, not glossy.
5.  **Lambda used correctly?** Way-finding mark, not decorative wallpaper. It has a purpose or it is not there.

If any answer is no, fix it and run the test again before shipping.

## What not to do

-   Do not diverge and plan to "align later". Always start off aligned.
-   Do not use the lambda as a loading spinner, background pattern, or favicon.
