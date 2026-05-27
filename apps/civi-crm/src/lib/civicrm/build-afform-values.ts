import {
  getCaseDefaultsForForm,
  isAfformIntakeFormName,
} from './afform-case-defaults'

export interface AfformFieldDef {
  entity?: string
  formKey: string
  fieldName: string
  join: string | null
  inputType: string
}

const MULTI_RECORD_JOINS = new Set(['Website', 'IM'])
const DEFAULT_ENTITY = 'Individual1'

type EntityBucket = {
  fields: Record<string, unknown>
  joins: Record<string, Record<string, unknown>[]>
}

function trim(s: unknown) {
  return s && typeof s === 'string' ? s.trim() : ''
}

function toArray(v: unknown): string[] {
  return Array.isArray(v) ? (v as string[]) : v ? [String(v)] : []
}

function getEntityBucket(
  entities: Record<string, EntityBucket>,
  entityKey: string
): EntityBucket {
  if (!entities[entityKey]) {
    entities[entityKey] = { fields: {}, joins: {} }
  }
  return entities[entityKey]
}

function finalizeJoins(joins: Record<string, Record<string, unknown>[]>) {
  if (joins.Email?.[0]) joins.Email[0].is_primary = true
  if (joins.Address?.[0]) joins.Address[0].location_type_id = 3

  for (const joinName of Object.keys(joins)) {
    if (MULTI_RECORD_JOINS.has(joinName) && joins[joinName].length === 0) {
      joins[joinName] = []
    }
  }
}

export function buildAfformValues(
  data: Record<string, unknown>,
  fieldDefs: AfformFieldDef[],
  formName?: string
): Record<string, unknown> {
  const entities: Record<string, EntityBucket> = {}

  for (const fieldDef of fieldDefs) {
    if (!fieldDef.formKey) continue
    const entityKey = fieldDef.entity ?? DEFAULT_ENTITY
    const bucket = getEntityBucket(entities, entityKey)
    const { formKey, fieldName, join, inputType } = fieldDef
    const raw = data[formKey]

    if (!join) {
      if (inputType === 'checkbox') {
        bucket.fields[fieldName] = raw === true ? ['1'] : []
      } else if (inputType === 'select') {
        bucket.fields[fieldName] = toArray(raw)
          .map((s) => String(s).trim())
          .filter(Boolean)
      } else if (inputType === 'hidden') {
        if (raw != null && raw !== '') bucket.fields[fieldName] = raw
      } else {
        bucket.fields[fieldName] = trim(raw) || ''
      }
      continue
    }

    if (!bucket.joins[join]) bucket.joins[join] = []

    if (MULTI_RECORD_JOINS.has(join)) {
      const values = toArray(raw)
        .map((s) => trim(s))
        .filter(Boolean)
      values.forEach((val, i) => {
        if (!bucket.joins[join][i]) bucket.joins[join][i] = {}
        bucket.joins[join][i][fieldName] =
          inputType === 'select' ? Number(val) || val : val
      })
    } else {
      if (!bucket.joins[join][0]) bucket.joins[join][0] = {}
      bucket.joins[join][0][fieldName] = trim(raw) || ''
    }
  }

  if (formName && isAfformIntakeFormName(formName)) {
    const caseBucket = getEntityBucket(entities, 'Case1')
    Object.assign(caseBucket.fields, getCaseDefaultsForForm(formName))
  }

  const values: Record<string, unknown> = { extra: [] }
  for (const [entityKey, bucket] of Object.entries(entities)) {
    finalizeJoins(bucket.joins)
    const hasFields = Object.keys(bucket.fields).length > 0
    const hasJoins = Object.values(bucket.joins).some((records) => records.length > 0)
    if (!hasFields && !hasJoins) continue
    values[entityKey] = [{ fields: bucket.fields, joins: bucket.joins }]
  }

  return values
}
