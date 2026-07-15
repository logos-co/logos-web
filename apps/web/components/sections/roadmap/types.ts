import type { RoadmapCopySection } from '@repo/content/schemas'

export type RoadmapAction =
  RoadmapCopySection['release']['items'][number]['modules'][number]['actions'][number]
export type ReleaseItem = RoadmapCopySection['release']['items'][number]
export type ReleaseModule = ReleaseItem['modules'][number]
export type OverviewCard = RoadmapCopySection['overview']['cards'][number]
