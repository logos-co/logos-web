# Logos — Shared Components

Reusable components used across all pages. Each entry includes a Figma reference, structure, variants, and responsive notes.

---

## 1. Nav Bar

**Figma:** `Nav` section — node 40009046:23611
**Instance name in frames:** `D2 Nav`

### Closed state (default)

| Property      | Value                                 |
| ------------- | ------------------------------------- |
| Height        | 40px                                  |
| Desktop width | 1440px                                |
| Mobile width  | 393px                                 |
| Background    | Transparent (overlays page content)   |
| Position      | Fixed, top-0, full width, z-index top |

**Layout — left to right:**

- `LOGOS` — wordmark, uppercase, small caps
- `MENU ≡` — opens overlay; changes to `CLOSE MENU ×` when open

### Open state (hamburger overlay)

Full-screen overlay, dark green background (`#0D1F17` approx).

**Desktop (two-column layout):**

| Column | Content                                                    |
| ------ | ---------------------------------------------------------- |
| Left   | `SITEMAP` label + large serif nav links stacked vertically |
| Right  | `JOIN OUR COMMUNITY` cards + `PRESS` section               |

**Sitemap links (large serif, ~80–96px):**

1. Technology Stack
2. Take Action
3. Logos Circles
4. Book
5. Links

**JOIN OUR COMMUNITY cards (3 cards, image background, dark overlay):**

- Lambda icon Build — "Everything you need to start building privacy-first decentralised applications. Explore ideas, find bounties, and connect with others."
- Lambda icon Node Programme — "The Node Programme is for anyone who wants to join our movement to revitalise civil society using decentralised technologies."
- Lambda icon Circles — "Local chapters are at the heart of our movement. Learn civil organising, share skills, and forge new connections."

**PRESS section:** label + `SEE ALL →` link + 4 press image thumbnails (date + headline below each).

**Mobile (single-column):**

- Same top bar
- Sitemap links stack full-width
- JOIN OUR COMMUNITY cards stack vertically (full width)
- PRESS thumbnails hidden or scrollable

```ts
interface NavProps {
  transparent?: boolean // default true; false = dark bg (inner pages)
  activePath?: string // highlights active sitemap link
}
```

---

## 2. Footer

**Implementation:** [`packages/ui/src/primitives/footer/footer.tsx`](../packages/ui/src/primitives/footer/footer.tsx)
**Site wrapper:** [`apps/web/components/site-footer.tsx`](../apps/web/components/site-footer.tsx) — wires Logos-specific links
**Figma:** `Footer` desktop — node 40009046:22948 · mobile — node 40009046:22697

Background: `bg-brand-dark-green`, `text-brand-off-white`.

Desktop (md+): 3-column layout — image + "Built by IFT" (left), logo + primary links + research + legal (middle), tagline + social + infrastructure (right). Mobile: 2-column with image + logo/tagline stacked on top.

```ts
interface FooterLink {
  label: string
  href: string
  external?: boolean // opens in new tab with rel="noopener noreferrer"
}

interface FooterProps {
  image?: ReactNode // <Image fill /> recommended
  tagline?: ReactNode
  logo?: ReactNode // Lambda icon Logos lockup
  mainLinks: FooterLink[] // Work With Us, Brand Guidelines
  socialLinks: FooterLink[] // Twitter, Discord, YouTube, Blog, Github
  researchLinks: FooterLink[] // under "RESEARCH" label
  infrastructureLinks: FooterLink[] // under "INFRASTRUCTURE" label
  legalLinks: FooterLink[] // Terms, Privacy, Security
  builtBy?: { label: string; attribution: ReactNode; href?: string }
  className?: string
}
```

---

## 3. Button

**Implementation:** [`packages/ui/src/primitives/button/button.tsx`](../packages/ui/src/primitives/button/button.tsx)
**Figma:** `CTA` component set — node 1022:6225

Renders `<a>` when `href` is provided, `<button>` otherwise. Label is auto-uppercased via CSS.

### Variants

| Variant     | Appearance                                                | Usage                                     |
| ----------- | --------------------------------------------------------- | ----------------------------------------- |
| `primary`   | Dark-green fill, off-white label, right-arrow icon        | Main CTAs (`APPLY →`, `SUBMIT AN IDEA →`) |
| `secondary` | Off-white bg, dark-green border + label, right-arrow icon | Secondary actions                         |
| `tertiary`  | No bg/border, dark-green label, right-arrow icon          | Ghost / inline actions                    |
| `link`      | Underlined label, no icon                                 | Inline text links                         |

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link' // default: 'primary'
  children: ReactNode // label text
  href?: string // renders <a> when set
  icon?: ReactNode | false // defaults to right-arrow; pass false to hide
  className?: string
  // + all native <button> or <a> attrs
}
```

---

## 4. GiantSwitch

**Implementation:** [`packages/ui/src/primitives/giant-switch/giant-switch.tsx`](../packages/ui/src/primitives/giant-switch/giant-switch.tsx)
**Figma:** `Logos App Giant Switch` component set — node 1972:22168

Oversized banner panel with a circular image disc and a content block. Used in Builders Hub for the "Install the Logos app" section. Also exports `GiantSwitchTag` for pill labels inside `tags`.

Desktop: image disc and content are absolutely positioned side-by-side (590px panel height, rounded-200). Mobile: stacked flex column (828px, rounded-100).

```ts
interface GiantSwitchProps {
  accent?: 'grey' | 'yellow' // default: 'grey'
  imagePosition?: 'left' | 'right' // desktop only; default: 'left'
  image: ReactNode // fill-mode <Image> recommended
  title: ReactNode
  description?: ReactNode
  tags?: ReactNode // <GiantSwitchTag> pills
  actions?: ReactNode // <Button> elements
  className?: string
}

interface GiantSwitchTagProps {
  icon?: ReactNode
  children: ReactNode
}
```

### Usage

```tsx
<GiantSwitch
  accent="grey"
  imagePosition="left"
  image={<Image fill src={...} alt="" />}
  title="Install the Logos app."
  description="..."
  tags={<><GiantSwitchTag icon={<WalletIcon />}>Wallet</GiantSwitchTag></>}
  actions={<><Button href="...">Install</Button><Button variant="secondary" href="...">Learn more</Button></>}
/>
```

---

## 5. Card

**Implementation:** [`packages/ui/src/primitives/card/card.tsx`](../packages/ui/src/primitives/card/card.tsx)
**Figma:** `Card hover` section — node 40009046:27669

Tech-stack / feature card used on the Homepage and Technology Stack pages. Default state: transparent bg, dark-green border, centred Lambda icon + title. Hover state: light-blue bg, top-left thumbnail, top-right CTA pill, description revealed.

Also exports `CardInfo` — a small rounded info block anchored to the bottom of a fixed-height card (used in the Blockchain section).

```ts
interface CardProps {
  title: ReactNode
  description?: ReactNode
  image?: ReactNode // thumbnail shown top-left on hover
  ctaLabel?: string // default: 'Learn more'
  ctaHref?: string // renders top-right CTA pill when provided
  showIcon?: boolean // show Lambda icon glyph; default true
  forceHover?: boolean // pin card in hover state (e.g. Figma parity)
  staticDefault?: boolean // lock in default state, disable hover reveal
  height?: number | string // fixed height; omit to size to content
  children?: ReactNode // extra content at bottom (e.g. CardInfo blocks)
  className?: string
}
```

---

## 6. Table + TableRow

**Implementation:** [`packages/ui/src/primitives/table/table.tsx`](../packages/ui/src/primitives/table/table.tsx)
**Figma:** `Side by Side` section — node 2259:43916

Used in list view on `/builders-hub/rfps` and `/builders-hub/ideas`. `Table` provides the header (serif title, mono subtitle, optional action slot). `TableRow` is a 50px full-width row — odd rows get a 5% dark-green tint, even rows grey-01; all rows switch to light-blue on hover.

Row columns: `flex-[714]` number + title · `flex-[464]` description · `w-[107px]` reward · action slot.

```tsx
<Table
  title="Ideas"
  subtitle="Lorem ipsum..."
  action={
    <Button variant="link" href="/submit">
      Submit an idea
    </Button>
  }
>
  <TableRow
    number="01"
    title="Secure and Decentralised Frontends"
    description={
      <>
        <p>Quadratic voting platform for DAO members</p>
        <p>Idea by @jonny</p>
      </>
    }
    action={
      <Button variant="link" href="/ideas/1">
        View
      </Button>
    }
  />
  <TableRow
    number="02"
    title="Build a DEX"
    reward={
      <>
        <p>2500 USDC</p>
        <p>+ 1000 XP</p>
      </>
    }
    action={
      <Button variant="link" href="/rfps/2">
        Apply
      </Button>
    }
  />
</Table>
```

```ts
interface TableProps {
  title: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
}

interface TableRowProps {
  number?: ReactNode
  title: ReactNode
  description?: ReactNode
  reward?: ReactNode // omit for Idea rows
  action?: ReactNode
  className?: string
}
```

---

## 7. ViewToggle

**Implementation:** [`packages/ui/src/primitives/view-toggle/view-toggle.tsx`](../packages/ui/src/primitives/view-toggle/view-toggle.tsx)
**Figma:** Labels `Grid (default)` / `List` — `RFPs` section — node 2213:32470

Generic view-mode switcher — `Grid / List` labels with a slash separator. Inactive option dimmed; active option underlined. Accepts either `getHref` (SSR-friendly, renders `<a>`) or `onChange` (client-side, renders `<button>`).

- Default view per page: **Grid** for RFPs, **List** for Ideas
- Toggle switches between `<Card>` grid layout and `<Table>` + `<TableRow>` list layout

```ts
interface ViewOption<Id extends string = string> {
  id: Id
  label: ReactNode
}

type ViewToggleProps<Id extends string = string> = {
  options: ViewOption<Id>[]
  view: Id // currently active id
  className?: string
} & (
  | { getHref: (id: Id) => string; onChange?: never }
  | { onChange: (id: Id) => void; getHref?: never }
)
```

---

## 8. Pagination

**Implementation:** [`packages/ui/src/primitives/pagination/pagination.tsx`](../packages/ui/src/primitives/pagination/pagination.tsx)

Used on `/builders-hub/ideas` and `/builders-hub/rfps` list/grid views. Renders `← 1 2 3 →`; collapses to `← 1 … 4 5 6 … 10 →` when `totalPages > maxVisible`. Accepts either `getHref` (SSR-friendly, renders `<a>`) or `onChange` (client-side).

```ts
type PaginationProps = {
  currentPage: number
  totalPages: number
  maxVisible?: number // default 5
  className?: string
} & (
  | { getHref: (page: number) => string; onChange?: never }
  | { onChange: (page: number) => void; getHref?: never }
)
```

---

## 9. Page Header — Builders Hub sub-pages

**Figma:** Top of Ideas (node `2259:41841`) and RFPs (node `2259:43033`) frames.

Shared header shell for `/builders-hub/*` sub-pages.

```
← BUILDERS HUB

Lambda icon [Page Title]       [description copy]       [Primary CTA →]

Grid / List                                               (view toggle, right-aligned)
```

```ts
interface BuildersHubPageHeaderProps {
  title: string // e.g. "Ideas" | "RFPs"
  description: string
  ctaLabel: string // e.g. "SUBMIT AN IDEA" | "SUBMIT AN RFP"
  ctaHref: string
  view: 'grid' | 'list'
  onViewChange: (view: 'grid' | 'list') => void
}
```

---

## Figma Node Quick Reference

| Component                       | Figma Node       |
| ------------------------------- | ---------------- |
| Nav section (desktop + mobile)  | `40009046:23611` |
| Nav bar desktop (open)          | `40009046:23686` |
| Nav bar mobile (open)           | `40009046:23612` |
| Footer desktop                  | `40009046:22948` |
| Footer mobile                   | `40009046:22697` |
| CTA component set               | `1022:6225`      |
| Giant Switch component set      | `1972:22168`     |
| Side by Side (card + row specs) | `2259:43916`     |
| Ideas desktop                   | `2259:41841`     |
| RFPs desktop                    | `2259:43033`     |
| Builders Hub desktop            | `2212:27068`     |
