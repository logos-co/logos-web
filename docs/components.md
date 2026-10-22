# Shared components

The components used on more than one page, with the props each one takes and the Figma node it was built from. Primitives live in [`packages/ui/src/primitives`](../packages/ui/src/primitives) and ship from `@acid-info/logos-ui`; page-level wrappers live in [`apps/web/components`](../apps/web/components). Colour and type names below are the tokens from `@acid-info/logos-tokens`.

## Nav

The closed bar is [`apps/web/components/site-header/site-header-client.tsx`](../apps/web/components/site-header/site-header-client.tsx); the full-screen menu is [`packages/ui/src/primitives/nav-overlay/nav-overlay.tsx`](../packages/ui/src/primitives/nav-overlay/nav-overlay.tsx).

Figma: `Nav` section, node `40009046:23611`. The open desktop frame is `40009046:23686` and the open mobile frame `40009046:23612`. Frames use the instance name `D2 Nav`.

### Closed state (default)

| Property      | Value                                      |
| ------------- | ------------------------------------------ |
| Height        | 40px                                       |
| Desktop width | 1440px                                     |
| Mobile width  | 393px                                      |
| Background    | Transparent, so page content shows through |
| Position      | Fixed, top-0, full width, top z-index      |

Left to right: the `LOGOS` wordmark in small caps, then `MENU ≡`, which turns into `CLOSE MENU ×` while the overlay is open.

### Open state

A full-screen overlay in dark green, about `#0D1F17`.

Desktop lays it out in two columns:

| Column | Content                                                |
| ------ | ------------------------------------------------------ |
| Left   | `SITEMAP` label and the large serif nav links, stacked |
| Right  | `JOIN OUR COMMUNITY` cards and the `PRESS` section     |

The sitemap links are large serif, roughly 80 to 96px, in this order:

1. Technology Stack
2. Take Action
3. Logos Circles
4. Book
5. Links

Each community card has an image background under a dark overlay and the Lambda icon above its label, three in total:

- Build: "Explore programmes and resources to help you build your cyberstate."
- Node Programme: "The Node Programme is for anyone who wants to join our movement to revitalise civil society using decentralised technologies."
- Circles: "Local chapters are at the heart of our movement. Learn civil organising, share skills, and forge new connections."

The press block is a label, a `SEE ALL →` link and four image thumbnails, each with its date and headline underneath.

On mobile the same bar stays on top, the sitemap links stack full width, the community cards stack vertically, and the press thumbnails are hidden or scroll sideways.

`NavOverlay` is a client component; import it from `@acid-info/logos-ui/client`. `isOpen` and `onClose` drive it, `sitemap`, `community`, `blog`, `menuPanels` and `primaryCta` carry the content, `labels` carries the localised strings and `linkAs` routes internal links through next-intl. `NavOverlayProps` in the source file has the remaining optional slots.

## Footer

Implementation: [`packages/ui/src/primitives/footer/footer.tsx`](../packages/ui/src/primitives/footer/footer.tsx). The site wrapper that wires the Logos links is [`apps/web/components/site-footer.tsx`](../apps/web/components/site-footer.tsx).

Figma: desktop node `40009046:22948`, mobile node `40009046:22697`.

Background is `bg-brand-dark-green` with `text-brand-off-white`. From `lg` (1025px) up the footer is three columns: image and "Built by IFT" on the left, logo with the primary, research and legal links in the middle, tagline with social and infrastructure links on the right. Below that it is two columns, with the image above the logo and tagline.

The Figma heights are minimums (663px mobile, 688px desktop). The legal links sit in normal flow, so three of them land exactly on those heights and a longer list makes the footer taller instead of clipping it. On desktop the image stays pinned 12px above the bottom edge.

### Newsletter form

`newsletterForm` replaces the static newsletter placeholder. The site passes `SiteFooterNewsletter`, which wraps `FooterNewsletter` from `@acid-info/logos-ui/client` ([`packages/ui/src/primitives/footer/footer-newsletter.tsx`](../packages/ui/src/primitives/footer/footer-newsletter.tsx)).

From top to bottom:

- Email, the only required field, marked with a red `*`
- Role dropdown and city input
- Country dropdown and submit button
- A `* required` legend, from `requiredLabel`, which defaults to `required`

The country dropdown is searchable: typing filters `countryOptions` (case and diacritics insensitive, prefix matches first), arrow keys move, Enter selects, Escape or a click outside closes. The selected label is submitted as it stands, which is why the site passes the funnel `COUNTRY_OPTIONS` labels. On submit the site subscribes to the Logos Newsletter and, when a city or country was given, the Regional Newsletter too.

```ts
interface FooterLink {
  label: string
  href: string
  external?: boolean // opens in a new tab with rel="noopener noreferrer"
}

interface FooterProps {
  image?: ReactNode // <Image fill /> recommended
  newsletter: {
    title: string
    emailLabel: string
    roleLabel: string
    cityLabel: string
    countryLabel?: string // placeholder falls back to 'Country'
    submitLabel: string
  }
  newsletterForm?: ReactNode // replaces the static placeholder form
  tagline?: ReactNode
  logo?: ReactNode // Lambda icon Logos lockup
  mainLinks: FooterLink[] // Work With Us, Brand Guidelines
  socialLinks: FooterLink[] // Twitter, Discord, YouTube, Blog, Github
  researchLinks: FooterLink[] // under the "RESEARCH" label
  infrastructureLinks: FooterLink[] // under the "INFRASTRUCTURE" label
  legalLinks: FooterLink[] // Terms, Privacy, Security, Testnet T&Cs, Testnet Privacy Policy
  builtBy?: { label: string; attribution: ReactNode; href?: string }
  className?: string
}

interface FooterNewsletterProps {
  emailLabel: string
  roleLabel: string
  cityLabel: string
  countryLabel: string
  submitLabel: string
  onSubmit: (values: {
    email: string
    role: string
    city: string
    country: string
  }) => Promise<void>
  roleOptions?: readonly string[] // default: Node operator, Builder, Activist
  countryOptions: readonly string[] // searchable
  requiredLabel?: string // default: 'required'
  successMessage?: string
}
```

## Button

Implementation: [`packages/ui/src/primitives/button/button.tsx`](../packages/ui/src/primitives/button/button.tsx). Figma: `CTA` component set, node `1022:6225`.

Renders an `<a>` when you pass `href` and a `<button>` otherwise. The label is uppercased in CSS, so write it in sentence case.

| Variant     | Appearance                                                          | Usage                                     |
| ----------- | ------------------------------------------------------------------- | ----------------------------------------- |
| `primary`   | Dark-green fill, off-white label, right-arrow icon                  | Main CTAs (`APPLY →`, `SUBMIT AN IDEA →`) |
| `secondary` | Off-white background, dark-green border and label, right-arrow icon | Secondary actions                         |
| `tertiary`  | No background or border, dark-green label, right-arrow icon         | Ghost and inline actions                  |
| `link`      | Underlined label, no icon                                           | Inline text links                         |

```ts
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'link' // default: 'primary'
  children: ReactNode // label text
  href?: string // renders <a> when set
  icon?: ReactNode | false // defaults to right-arrow; pass false to hide
  linkAs?: LinkLikeComponent // router link for internal hrefs
  className?: string
  // plus all native <button> or <a> attributes
}
```

## GiantSwitch

Implementation: [`packages/ui/src/primitives/giant-switch/giant-switch.tsx`](../packages/ui/src/primitives/giant-switch/giant-switch.tsx). Figma: `Logos App Giant Switch` component set, node `1972:22168`.

A banner panel with a circular image disc and a content block, used in Builders Hub for the "Install the Logos app" section. It also exports `GiantSwitchTag` for the pills inside `tags`.

From `xl` up the disc and the content are absolutely positioned side by side in a 590px panel with `rounded-200`. Below that the layout stacks into a flex column with `rounded-100`, sized to its content. The image is always on top on mobile, whatever `imagePosition` says.

```ts
interface GiantSwitchProps {
  accent?: 'grey' | 'yellow' // default: 'grey'
  imagePosition?: 'left' | 'right' // desktop only; default: 'left'
  installHoverShift?: boolean // default: false
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

```tsx
<GiantSwitch
  accent="grey"
  imagePosition="left"
  image={<Image fill src={...} alt="" />}
  title="Install the Logos app."
  description="..."
  tags={<GiantSwitchTag>Wallet</GiantSwitchTag>}
  actions={
    <>
      <Button href="...">Install</Button>
      <Button variant="secondary" href="...">Learn more</Button>
    </>
  }
/>
```

## Card

Implementation: [`packages/ui/src/primitives/card/card.tsx`](../packages/ui/src/primitives/card/card.tsx). Figma: `Card hover` section, node `40009046:27669`.

The tech-stack and feature card used on the homepage and the technology stack pages. In its default state it has a transparent background, a dark-green border and a centred Lambda icon with the title. On hover the background turns light blue and the card reveals a thumbnail in the top-left, a CTA pill in the top-right and the description.

It also exports `CardInfo`, a small rounded info block pinned to the bottom of a fixed-height card, used in the Blockchain section.

```ts
interface CardProps {
  title: ReactNode
  description?: ReactNode
  image?: ReactNode // thumbnail shown top-left on hover
  ctaLabel?: string // default: 'Learn more'
  ctaHref?: string // renders a top-right CTA pill when provided
  linkAs?: LinkLikeComponent // router link for ctaHref
  showIcon?: boolean // show the Lambda icon; default true
  forceHover?: boolean // pin the card in its hover state (Figma parity)
  staticDefault?: boolean // lock the default state, no hover reveal
  height?: number | string // fixed height; omit to size to content
  children?: ReactNode // extra content at the bottom, e.g. CardInfo
  className?: string
}
```

## Table and TableRow

Implementation: [`packages/ui/src/primitives/table/table.tsx`](../packages/ui/src/primitives/table/table.tsx). Figma: `Side by Side` section, node `2259:43916`.

Used in list view on `/builders-hub/rfps` and `/builders-hub/ideas`. `Table` renders the header: a serif title, a mono subtitle and an optional action slot. `TableRow` is a 50px full-width row, tinted 5% dark green on odd rows and `gray-01` on even ones, switching to light blue on hover. Below `md` the description, reward and action columns are hidden.

The columns divide roughly as 714 for number and title, 464 for the description, a fixed 107px for the reward, then the action slot.

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
  reward?: ReactNode // omit for idea rows
  action?: ReactNode
  className?: string
}
```

## ViewToggle

Implementation: [`packages/ui/src/primitives/view-toggle/view-toggle.tsx`](../packages/ui/src/primitives/view-toggle/view-toggle.tsx). Figma: labels `Grid (default)` and `List` in the `RFPs` section, node `2213:32470`.

Switches between grid and list with the labels `Grid / List` and a slash between them. The inactive option is dimmed, the active one is underlined. Pass `getHref` for a server-rendered link per view, or `onChange` for a client-side switch. Passing both is a type error.

The default view comes from content, not from the component: `content/builders-hub/listings/rfps/en.json` sets grid and `content/builders-hub/listings/ideas/en.json` sets list.

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

## Pagination

Implementation: [`packages/ui/src/primitives/pagination/pagination.tsx`](../packages/ui/src/primitives/pagination/pagination.tsx).

Used by the `/builders-hub/ideas` and `/builders-hub/rfps` listings. Renders `← 1 2 3 →`, and collapses to `← 1 … 4 5 6 … 10 →` once `totalPages` goes past `maxVisible`. Same split as `ViewToggle`: `getHref` renders links, `onChange` renders buttons.

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

## Builders Hub listing header

[`apps/web/components/sections/builders-hub/builders-hub-listing-header.tsx`](../apps/web/components/sections/builders-hub/builders-hub-listing-header.tsx) is the header on `/builders-hub/ideas` and `/builders-hub/rfps`: a back link, the page title with the Lambda mark, the description, an optional submit CTA, and the `Grid / List` toggle on the right.

Figma: RFPs desktop node `40009046:25012`, RFPs mobile `40009046:24924`.

It takes `buildViewHref` when the toggle should be a link, or `onViewChange` when the listing keeps state in the client. The rest of the props are filters on the same header:

```ts
type Props = {
  title: string
  description?: string
  submitCta?: CTA
  view: 'grid' | 'list'
  mobileDescription?: string
  mobileSpacious?: boolean
  eyebrow?: string
  backHref?: string
  backLabel?: string // default: 'builders hub'
} & (
  | { buildViewHref: (view: 'grid' | 'list') => string; onViewChange?: never }
  | { onViewChange: (view: 'grid' | 'list') => void; buildViewHref?: never }
)
```

## Figma nodes

| Component                       | Figma node       |
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
