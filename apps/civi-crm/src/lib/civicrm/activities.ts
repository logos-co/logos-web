import { civiClient } from './client'
import { civiConfig } from './config'
import type { CiviActivity } from './types'
import type { PaginatedResponse } from '@/types/case'
import { PAGE_SIZE } from '@/constants/pagination'

export async function listActivities(
  caseId: string,
  page: number
): Promise<PaginatedResponse<CiviActivity>> {
  const offset = (page - 1) * PAGE_SIZE
  const where = [['case_id', '=', Number(caseId)]] as [string, string, number][]

  const [items, total] = await Promise.all([
    civiClient.get<CiviActivity>('Activity', {
      select: [
        'id',
        'activity_type_id',
        'subject',
        'activity_date_time',
        'source_contact_id',
        'source_contact_id.display_name',
        'case_id',
        'status_id:label',
      ],
      where,
      orderBy: [['activity_date_time', 'DESC']],
      limit: PAGE_SIZE,
      offset,
    }),
    civiClient.count('Activity', { where }),
  ])

  return { items, total, page, pageSize: PAGE_SIZE }
}

export async function createActivity(
  values: Record<string, unknown>
): Promise<void> {
  await civiClient.create('Activity', {
    activity_type_id: civiConfig.CMS_ACTIVITY_TYPE_ID,
    ...values,
  })
}
