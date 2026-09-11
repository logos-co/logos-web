/**
 * Shared class tokens for the PriFi page sections.
 */

/**
 * Figma measures most of this page's gaps cap-to-cap: the text nodes carry
 * `text-box-trim: trim-both` with `text-box-edge: cap alphabetic`. Applying
 * the same trim lands the spacing on Figma's numbers. `text-box` is Chrome
 * 133+/Safari 18.2+; older engines fall back to the untrimmed rhythm.
 */
export const TRIM = '[text-box:trim-both_cap_alphabetic]'

/** Figma's 18px body: Public Sans, 1.2 line height, -0.36px tracking. */
export const BODY_18 = 'text-[18px] leading-[1.2] tracking-[-0.02em]'

/** Figma's 12px mono cell copy (10px in the file, raised to 12px site-wide). */
export const MONO_CELL = 'font-mono text-xs font-medium uppercase leading-[1.3]'
