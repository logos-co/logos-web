/**
 * Checks a block id, transaction hash or account address before it goes into a
 * node URL.
 *
 * Every id the chain uses is hex, so anything else cannot match and is refused
 * before a request is made. That keeps `/`, `?`, `#` and `..` out of the path,
 * so a query cannot steer the server to another node endpoint.
 */

/** Long enough for any id the chain uses, short enough not to be a payload. */
export const MAX_CHAIN_ID_LENGTH = 128

const CHAIN_ID = new RegExp(`^[0-9a-fA-F]{1,${MAX_CHAIN_ID_LENGTH}}$`)

export function isChainId(value: string): boolean {
  return CHAIN_ID.test(value)
}
