import {
  buildPublishStatus,
  type PublishRun,
  type PublishStatus,
} from './publish-status'
import type { PublishEnvironment } from './environments'

export interface PublishStatusResult {
  fetchedAt: string
  status: PublishStatus
}

export const createLoadPublishStatus =
  (dependencies: {
    listRuns: (environment: PublishEnvironment) => Promise<PublishRun[]>
  }): (() => Promise<PublishStatusResult>) =>
  async () => {
    // Mutations use the same fresh queue state as the dashboard, never a cached success.
    const [dev, production] = await Promise.all([
      dependencies.listRuns('dev'),
      dependencies.listRuns('production'),
    ])
    return {
      fetchedAt: new Date().toISOString(),
      status: buildPublishStatus({ dev, production }),
    }
  }
