# Responsive Image Frame Fitting

A set of composable techniques for making a raster image fill a card or frame
perfectly at every viewport size -- no distortion, no uncovered background, no
fixed-pixel hacks that break when the layout changes.

These techniques are framework-agnostic in concept. Code examples use Next.js
`Image`, Tailwind v4, and CSS. A complete worked example for the logos-co web
homepage is in the [reference implementation](#reference-implementation) section.

---

## Core formula

Every sizing decision derives from one number: the image's **aspect ratio**.

```
aspect_ratio = image_width / image_height
```

A frame whose dimensions satisfy `frame_width / frame_height = aspect_ratio`
fits the image with zero cropping. All techniques below either maintain that
ratio automatically or pre-compute frame heights that satisfy it at specific
breakpoints.

---

## Technique 1 -- `fill` + `relative overflow-hidden` container

Make the image always occupy exactly the bounding box of its container.

```tsx
<div className="relative overflow-hidden">
  <Image fill alt="" ... />
</div>
```

**How it works**

Next.js `Image fill` (or plain CSS `position: absolute; inset: 0; width: 100%;
height: 100%`) pins the image to the nearest positioned ancestor. The container
becomes the frame; `overflow-hidden` clips anything that spills outside it.

**Requirements**

| Requirement | Why |
|---|---|
| Container has `position: relative` (or `absolute` / `fixed`) | Anchors the absolutely-positioned image |
| Container has an explicit height | Without one the container collapses to 0 px and the image disappears |
| `overflow-hidden` on the container | Clips overflow cleanly; also applies `border-radius` to the image without an extra wrapper |

**When to use**

Always -- this is the foundation every other technique builds on.

---

## Technique 2 -- `aspect-ratio` for fully fluid ranges

Let the browser compute the frame height from its width automatically.

```css
.frame {
  aspect-ratio: <image_width> / <image_height>;
}
```

```tsx
{/* Tailwind arbitrary value */}
<div className="aspect-[1920/1080]">
```

**How it works**

`aspect-ratio` makes `height = width × (image_height / image_width)` at every
pixel. The frame is always in ratio with the image, so `object-cover` has
nothing to crop.

**When to use**

Any viewport range where the frame spans the full container width and that width
changes continuously -- typically **mobile** (< the first multi-column
breakpoint) or any single-column layout.

**Resetting at a breakpoint**

When switching from fluid to fixed at a breakpoint, clear the property:

```tsx
<div className="aspect-[W/H] lg:aspect-auto lg:h-[Xpx]">
```

`aspect-auto` restores the browser default (no ratio constraint), letting the
explicit height take over without conflict.

---

## Technique 3 -- `object-fit` and `object-position`

Control how the image scales inside the frame when their ratios differ.

```tsx
<Image className="object-cover object-top" fill alt="" />
```

**`object-cover`**

Scales the image uniformly until both frame dimensions are fully covered, then
clips the excess. Guarantees no letterboxing and no stretching. Use this almost
always with `fill`.

**`object-contain`** (alternative)

Scales the image to fit entirely inside the frame, leaving empty space
(letterbox / pillarbox). Only appropriate when you must never clip any part of
the image.

**`object-position`**

Controls which part of the image remains visible when clipping occurs.

| Value | Effect | When to use |
|---|---|---|
| `object-center` (default) | Crops equally from all sides | Symmetric images; safe focal point is the center |
| `object-top` | Anchors top edge; clips from bottom | Images whose important content is at the top |
| `object-bottom` | Anchors bottom edge; clips from top | Images whose important content is at the bottom |
| `object-left` / `object-right` | Anchors a side | Portraits, off-center compositions |
| `object-[X%_Y%]` | Arbitrary focal point | Precise control via Tailwind arbitrary value |

At viewports where the frame aspect ratio exactly matches the image ratio
(Technique 2 on mobile; Technique 4 on desktop) `object-cover` does not clip at
all. `object-position` only matters between breakpoints where some cropping is
unavoidable.

---

## Technique 4 -- derived fixed heights at known breakpoints

When the frame width is determined by a multi-column grid (not the viewport
directly), pre-compute the height that maintains the aspect ratio at each
breakpoint.

**Formula**

```
frame_height = frame_width × (image_height / image_width)
```

**Steps**

1. Determine the frame's pixel width at each relevant breakpoint from your
   grid/layout (column count, gap, container padding).
2. Multiply each width by `(image_height / image_width)`.
3. Round to the nearest pixel and set as fixed height classes.

```tsx
<div className="lg:h-[374px] xl:h-[471px] 2xl:h-[532px]">
```

**Between breakpoints**

Between two defined breakpoints the height is fixed at the last-defined value
(standard CSS min-width cascade in Tailwind). The frame briefly becomes slightly
wider than the matched ratio as the viewport grows toward the next breakpoint;
`object-cover` handles this by covering the width and cropping a small amount
from the bottom (or whichever edge `object-position` deprioritises).

**When to use**

Whenever the frame is inside a CSS Grid or Flexbox layout that determines
column widths at specific breakpoints -- typically **desktop** ranges.

---

## Technique 5 -- sibling height synchronisation

When the image frame is a grid column alongside a content column, keep their
heights in sync so the grid row is not stretched by the taller sibling.

```tsx
{/* Content column */}
<div className="lg:min-h-[374px] xl:min-h-[471px] 2xl:min-h-[532px]">

{/* Image frame column */}
<div className="lg:h-[374px] xl:h-[471px] 2xl:h-[532px]">
```

**Why `min-height` on the content column, not `height`**

`height` would clip content if it overflows. `min-height` lets the column grow
with its content while guaranteeing it is at least as tall as the image frame.
The image frame uses `height` (fixed) because it must never grow and distort
the image.

**When to use**

Any multi-column layout where the image frame and a sibling column are meant to
share the same row height.

---

## Technique 6 -- `sizes` attribute for bandwidth-efficient delivery

Tell the browser the rendered width of the image at each breakpoint so it
selects the smallest sufficient source from the `srcset`.

```tsx
<Image
  sizes="
    (max-width: <single-col-breakpoint>) calc(100vw - <padding>),
    (max-width: <max-width>) calc(<col-fraction>vw - <gap>),
    <max-card-width>px
  "
/>
```

**Rules**

- Match the `sizes` conditions to your actual CSS breakpoints.
- Account for container padding and grid gaps in `calc()`.
- End with a unitless pixel value for the maximum rendered width (caps the
  largest source the browser will fetch).
- Next.js generates a `srcset` from this automatically; you only need `sizes`.

**Impact of getting it wrong**

- Too large: browser downloads a 2× or 3× oversized image on every mobile load.
- Too small: browser fetches a blurry undersized image on wide screens.

---

## Putting it together -- decision tree

```
Does the frame span the full container width at this viewport range?
├── Yes → use aspect-ratio (Technique 2) -- no breakpoints needed
└── No  → compute frame_width from your grid at each breakpoint
           └── apply derived heights (Technique 4)

Does the image have an off-center focal point?
├── Yes → set object-position to preserve it (Technique 3)
└── No  → object-center (default) is fine

Is the image frame a grid column with a sibling?
├── Yes → mirror heights as min-height on the sibling (Technique 5)
└── No  → skip

Always: fill + relative overflow-hidden (Technique 1)
Always: sizes attribute (Technique 6)
```

---

## Reference implementation

**logos-co / `apps/web` -- Basecamp card on the homepage**

Source: `apps/web/components/sections/home/builder-portal-section.tsx`

### Image file

| Property | Value |
|---|---|
| Path | `/public/images/home/figma-refresh/basecamp.webp` |
| Dimensions | 2820 × 1596 px |
| Aspect ratio | 1.767 |
| Format | WebP, quality 85, method 6 (converted from 1.2 MB PNG → 121 KB) |

### Layout

```
ContentWidth  max-w-[1440px]  px-3  (24 px total horizontal padding)
└── grid  lg:grid-cols-3  lg:gap-3  (gap = 12 px each)
    ├── col 1      text column       (1 column)
    └── col 2-3    image frame       (lg:col-span-2)
```

At the Figma reference viewport (1440 px) the frame resolves to **940 × 532 px**
(940 ÷ 532 = 1.767), matching the image aspect ratio exactly -- this is by
design and is the anchor for all derived heights.

### Frame widths per breakpoint

| Breakpoint | Viewport | Mode | Frame width | Derivation |
|---|---|---|---|---|
| default | 360 px | full width | 336 px | 360 − 24 |
| `sm` | 640 px | full width | 616 px | 640 − 24 |
| `md` | 768 px | full width | 744 px | 768 − 24 |
| `lg` | 1024 px | col-span-2 | ~662 px | (1024−24−24)÷3×2+12 |
| `xl` | 1280 px | col-span-2 | ~833 px | (1280−24−24)÷3×2+12 |
| `desktop` | 1440 px | col-span-2 | 940 px | (1440−24−24)÷3×2+12 |

### Derived heights

```
height = frame_width × (1596 / 2820)
```

| Breakpoint | Frame width | Height | Class |
|---|---|---|---|
| mobile (fluid) | varies | computed by browser | `aspect-[2820/1596]` |
| `lg` | 662 px | 374 px | `lg:h-[374px]` |
| `xl` | 833 px | 471 px | `xl:h-[471px]` |
| `desktop` | 940 px | 532 px | `desktop:h-[532px]` |

### Final JSX

```tsx
{/* Text column -- mirrors frame height at each desktop breakpoint */}
<div className="flex flex-col gap-10 lg:min-h-[374px] xl:min-h-[471px] desktop:min-h-[532px] lg:justify-between lg:gap-0">
  ...
</div>

{/* Image frame */}
<div className="relative aspect-[2820/1596] lg:aspect-auto lg:h-[374px] xl:h-[471px] desktop:h-[532px] overflow-hidden rounded-3xl bg-[#1c1c1c] lg:col-span-2">
  <Image
    src="/images/home/figma-refresh/basecamp.webp"
    alt=""
    fill
    sizes="(max-width: 1024px) calc(100vw - 24px), (max-width: 1440px) calc(66.67vw - 20px), 940px"
    className="object-cover object-top"
  />
</div>
```

**Why `object-top`:** the image has a dark gradient border at the top that
blends with `bg-[#1c1c1c]`. `object-center` (the default) would crop into the
top of the app window bezel. `object-top` keeps the full window frame visible.
