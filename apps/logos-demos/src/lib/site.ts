/**
 * Facts about this site that metadata needs.
 *
 * Deliberately constants rather than environment reads. Metadata for a
 * statically prerendered page is resolved at build time, so an environment
 * read would be frozen into the output, and `turbo.json` strips undeclared
 * variables from the build anyway. A constant has neither problem.
 */

export const SITE_URL = 'https://logos-demos.vercel.app'

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
