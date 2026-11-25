/**
 * Facts about this site that metadata needs.
 *
 * The app has no hosted deployment, so the URL defaults to the local dev
 * server. Metadata for a prerendered page is resolved at build time, so
 * `NEXT_PUBLIC_SITE_URL` is read then; `turbo.json` declares it for the build.
 */

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3005'

export const SITE_NAME = 'Logos Demos'

export const SITE_DESCRIPTION =
  'Try the Logos stack from a browser. Send a message over the peer-to-peer network, read the blockchain testnet, and give a file its storage address. No account, no install.'

/**
 * The generated card at `src/app/opengraph-image.tsx`.
 *
 * Next serves it from this path and normally wires it up on its own, but a
 * page that declares its own `openGraph` replaces the layout's outright, so
 * pages that do have to name it.
 */
export const OG_IMAGE = '/opengraph-image'
