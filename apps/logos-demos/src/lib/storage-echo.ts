/**
 * echo.codex.storage, the one Logos Storage service a browser may call.
 *
 * It answers with `access-control-allow-origin: *` and allows the
 * `X-Real-IP-Custom` header, which is how the official marketplace UI checks a
 * node it is looking at rather than the caller. So the roster can be shown
 * located and reachable rather than as a static list.
 *
 * Checked 2026-09-08. It is infrastructure we do not own; treat a failure here
 * as normal and show the roster without the extra columns.
 */

const ECHO = 'https://echo.codex.storage'

export type NodeLocation = {
  city: string
  country: string
  countryIso: string
  asnOrg: string
  latitude: number | null
  longitude: number | null
}

const text = (value: unknown) => (typeof value === 'string' ? value : '')
const num = (value: unknown) => (typeof value === 'number' ? value : null)

export function parseLocation(raw: unknown): NodeLocation | null {
  if (typeof raw !== 'object' || raw === null) return null

  const data = raw as Record<string, unknown>
  const country = text(data.country)
  if (!country) return null

  return {
    city: text(data.city),
    country,
    countryIso: text(data.country_iso),
    asnOrg: text(data.asn_org),
    latitude: num(data.latitude),
    longitude: num(data.longitude),
  }
}

/** Where a node's address actually is, per the echo service. */
export async function fetchLocation(ip: string): Promise<NodeLocation | null> {
  try {
    const response = await fetch(`${ECHO}/json?ip=${encodeURIComponent(ip)}`)
    if (!response.ok) return null
    return parseLocation(await response.json())
  } catch {
    return null
  }
}

/**
 * Whether a node is accepting TCP connections on a port, right now.
 *
 * The check runs from the echo service, not from here, which is the only way a
 * page could learn this: a browser cannot open a raw socket, and the nodes
 * filter by source address anyway.
 */
export async function fetchReachable(
  ip: string,
  port: number
): Promise<boolean | null> {
  try {
    const response = await fetch(`${ECHO}/port/${port}`, {
      headers: { 'X-Real-IP-Custom': ip },
    })
    if (!response.ok) return null

    const data = (await response.json()) as Record<string, unknown>
    return typeof data.reachable === 'boolean' ? data.reachable : null
  } catch {
    return null
  }
}
