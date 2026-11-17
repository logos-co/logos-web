/**
 * Checks a block id, transaction hash or account address before it goes into a
 * node URL.
 *
 * The node reads all three (`HeaderId`, `TxHash`, `ZkPublicKey`) as 32 bytes of
 * hex with an optional `0x` prefix, so anything else cannot match and is
 * refused before a request is made. That keeps `/`, `?`, `#` and `..` out of
 * the path, so a query cannot steer the server to another node endpoint.
 */

/** Long enough for any id the chain uses, short enough not to be a payload. */
export const MAX_CHAIN_ID_LENGTH = 128

const CHAIN_ID = /^(?:0x)?[0-9a-fA-F]{64}$/

export function isChainId(value: string): boolean {
  return CHAIN_ID.test(value)
}
