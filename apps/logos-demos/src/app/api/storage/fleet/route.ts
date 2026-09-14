import { NextResponse } from 'next/server'

import type { FleetName } from '@/lib/storage-fleet'
import { FLEET_URL, FLEETS } from '@/lib/storage-fleet'

/**
 * Reads a Logos Storage fleet roster from fleets.logos.co.
 *
 * The roster is public, but it is served with no `access-control-allow-origin`
 * header at all, so a browser is not allowed to read the response. That is why
 * this route exists.
 *
 * It passes the roster through unchanged rather than normalising it, so there
 * is one shape and one parser (`parseFleet`, on the client) rather than two.
 *
 * It is the roster, not the network. Nothing here talks to a storage node. See
 * docs/storage-research.md for why a browser cannot.
 */

/** The roster changes rarely, so a short shared cache is plenty. */
const CACHE_SECONDS = 60

const isFleet = (value: string | null): value is FleetName =>
  FLEETS.includes(value as FleetName)

export async function GET(request: Request) {
  const requested = new URL(request.url).searchParams.get('fleet')

  // Only the published fleet names are accepted, so the name cannot be used to
  // point this route at some other host.
  if (!isFleet(requested)) {
    return NextResponse.json(
      { error: `Unknown fleet. Expected one of ${FLEETS.join(', ')}.` },
      { status: 400 },
    )
  }

  try {
    const response = await fetch(FLEET_URL(requested), {
      next: { revalidate: CACHE_SECONDS },
    })

    if (!response.ok) {
      return NextResponse.json(
        { error: `The roster answered ${response.status}.` },
        { status: 502 },
      )
    }

    return NextResponse.json(await response.json(), {
      headers: {
        'Cache-Control': `public, max-age=0, s-maxage=${CACHE_SECONDS}`,
      },
    })
  } catch {
    return NextResponse.json(
      { error: 'Could not reach the fleet roster.' },
      { status: 502 },
    )
  }
}
