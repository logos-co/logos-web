import type { ScoutEventInput } from '@/contracts/scout'

import { apiClient } from './api-client'

export function recordScoutUiEvent(input: ScoutEventInput): void {
  void apiClient('/api/v1/scout/events', {
    method: 'POST',
    body: JSON.stringify(input),
  }).catch(() => undefined)
}
