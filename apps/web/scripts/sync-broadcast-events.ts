import { join } from 'node:path'

import { syncBroadcastEventsSnapshot } from '../lib/broadcast-events-snapshot'

await syncBroadcastEventsSnapshot(
  join(
    import.meta.dirname,
    '..',
    'lib',
    'data',
    'broadcast-events.snapshot.json'
  )
)
