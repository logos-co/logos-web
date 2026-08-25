import { z } from 'zod/v4'

/**
 * Pipelines, taken from the production Notion CRM export rather than invented.
 *
 * That export is one flat table carrying a separate status column per business
 * unit - `Status` for Ecodev, `Mvmt Status` for Movement - and the two are
 * disjoint in practice: of 126 Movement rows, 124 use only `Mvmt Status` and
 * none use `Status`. So a single global stage list would be wrong in the way
 * that matters: it would let a Movement case sit in `negotiation`, which is not
 * a state that team has.
 *
 * A case therefore names its pipeline, and its stage must be one of that
 * pipeline's stages. The pairing is validated at every write boundary, because
 * a stage that does not belong to its pipeline silently breaks the board, the
 * queues, and every count built on them.
 *
 * The keys are stored; the labels are shown. They are separate because two of
 * the Notion labels carry emoji, and a stored value that can be re-typed by
 * anyone editing a select option is not something reports can be built on.
 *
 * Not modelled here: the export's third status column, `Nimbus Status`. It is
 * not a third pipeline - 60 of its 64 real values sit on rows that also carry
 * an Ecodev `Status`, so it is a second axis over the same case rather than an
 * alternative to it. Modelling it as a pipeline would be wrong, and modelling
 * it as an axis needs a stakeholder nobody has interviewed. See
 * `docs/open-questions.md`.
 */
export const pipelineKeys = ['ecodev', 'movement'] as const

export type PipelineKey = (typeof pipelineKeys)[number]

/**
 * What reaching a stage means for the case, kept separate from the label so
 * reporting does not have to pattern-match on display text. `parked` is not
 * `lost`: an archived or future lead is one nobody is working, not one that
 * went away, and a funnel that counts them together overstates loss.
 */
export const stageKinds = [
  'open',
  'won',
  'redirected',
  'lost',
  'parked',
] as const

export type StageKind = (typeof stageKinds)[number]

export interface PipelineStage {
  readonly key: string
  readonly label: string
  readonly kind: StageKind
}

export interface Pipeline {
  readonly key: PipelineKey
  readonly label: string
  /** Board column order. Terminal stages sort after open ones. */
  readonly stages: readonly PipelineStage[]
}

const ECODEV_STAGES = [
  { key: 'lead', label: 'Lead', kind: 'open' },
  { key: 'preliminary_interest', label: 'Preliminary interest', kind: 'open' },
  { key: 'qualified', label: 'Qualified', kind: 'open' },
  { key: 'solution_eng', label: 'Solution Eng 👀', kind: 'open' },
  { key: 'negotiation', label: 'Negotiation', kind: 'open' },
  { key: 'confirmed', label: 'Confirmed 💪', kind: 'won' },
  { key: 'lost', label: 'Lost', kind: 'lost' },
  { key: 'future', label: 'Future', kind: 'parked' },
  { key: 'archive', label: 'Archive', kind: 'parked' },
] as const satisfies readonly PipelineStage[]

const MOVEMENT_STAGES = [
  { key: 'new_lead', label: 'New Lead', kind: 'open' },
  { key: 'mvmt_review', label: 'Mvmt Review', kind: 'open' },
  { key: 'eligible', label: 'Eligible', kind: 'open' },
  { key: 'training_call', label: 'Training Call', kind: 'open' },
  { key: 'elearning', label: 'Elearning', kind: 'open' },
  { key: 'active', label: 'Active', kind: 'won' },
  { key: 'redirected', label: 'Redirected', kind: 'redirected' },
  {
    key: 'redirected_post_call',
    label: 'Redirected - Post Call',
    kind: 'redirected',
  },
  { key: 'redirected_final', label: 'Redirected - Final', kind: 'redirected' },
  { key: 'no_show', label: 'No Show', kind: 'lost' },
  { key: 'inactive', label: 'Inactive', kind: 'parked' },
] as const satisfies readonly PipelineStage[]

export const PIPELINES: Readonly<Record<PipelineKey, Pipeline>> = {
  ecodev: { key: 'ecodev', label: 'Ecodev', stages: ECODEV_STAGES },
  movement: { key: 'movement', label: 'Movement', stages: MOVEMENT_STAGES },
}

export const pipelineList: readonly Pipeline[] = pipelineKeys.map(
  (key) => PIPELINES[key]
)

export const pipelineKeySchema = z.enum(pipelineKeys)

export function getPipeline(key: PipelineKey): Pipeline {
  return PIPELINES[key]
}

export function findStage(
  pipeline: PipelineKey,
  stage: string
): PipelineStage | undefined {
  return PIPELINES[pipeline].stages.find((item) => item.key === stage)
}

export function isStageOf(pipeline: PipelineKey, stage: string): boolean {
  return findStage(pipeline, stage) !== undefined
}

/**
 * Falls back to the raw key rather than throwing. A stage that predates a
 * catalogue change still has to render: showing the stored key is ugly, but
 * blanking the card or crashing the board loses the case.
 */
export function stageLabel(pipeline: PipelineKey, stage: string): string {
  return findStage(pipeline, stage)?.label ?? stage
}

export function stageKind(pipeline: PipelineKey, stage: string): StageKind {
  return findStage(pipeline, stage)?.kind ?? 'open'
}

/** The stage a case starts in when nothing else is specified. */
export function defaultStageFor(pipeline: PipelineKey): string {
  const [first] = PIPELINES[pipeline].stages
  if (!first) throw new Error(`Pipeline ${pipeline} has no stages.`)
  return first.key
}

/**
 * Any stage may be moved to any other stage in the same pipeline. Unlike the
 * status machine, which encodes a lifecycle the app is willing to enforce, the
 * board is a direct manipulation of where a coordinator says the work is - and
 * a deal that jumps from `lead` to `confirmed` because it closed in one call is
 * a real thing that happened, not an error to reject.
 *
 * What is refused is a stage from a different pipeline, which is not a shortcut
 * but a category error.
 */
export function canMoveToStage(pipeline: PipelineKey, stage: string): boolean {
  return isStageOf(pipeline, stage)
}
