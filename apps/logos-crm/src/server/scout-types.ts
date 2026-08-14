import type {
  scoutBands,
  scoutDimensions,
  scoutEvidenceFields,
} from '@/contracts/values'

export type ScoutBand = (typeof scoutBands)[number]
export type ScoutDimension = (typeof scoutDimensions)[number]
export type ScoutEvidenceField = (typeof scoutEvidenceFields)[number]
