import { randomBytes } from 'node:crypto'

// Returns the secret `next dev` should use. A configured PAYLOAD_SECRET wins;
// otherwise a random one is generated per run so no shared fallback exists.
export const resolveDevPayloadSecret = (
  configured: string | undefined
): { generated: boolean; secret: string } => {
  if (configured) {
    return { generated: false, secret: configured }
  }

  return { generated: true, secret: randomBytes(32).toString('hex') }
}
