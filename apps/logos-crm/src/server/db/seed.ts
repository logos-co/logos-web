import { count } from 'drizzle-orm'

import { db, pool } from './index'
import * as schema from './schema'

const day = 24 * 60 * 60 * 1000
const now = Date.now()

const [result] = await db.select({ value: count() }).from(schema.cases)

if (result?.value === 0) {
  await db.insert(schema.cases).values([
    {
      title: 'Protocol research partnership',
      organisation: 'Open Systems Lab',
      owner: 'Mara Chen',
      status: 'in_progress',
      stage: 'Qualification',
      priority: 'high',
      nextAction: 'Confirm technical discovery session',
      nextActionAt: new Date(now + day),
      lastContactAt: new Date(now - day),
    },
    {
      title: 'Community node programme',
      organisation: 'Nodecraft Collective',
      owner: 'Jon Bell',
      status: 'waiting',
      stage: 'Proposal',
      priority: 'medium',
      nextAction: 'Review hosting requirements',
      nextActionAt: new Date(now + day * 3),
      lastContactAt: new Date(now - day * 4),
    },
    {
      title: 'Privacy tooling collaboration',
      organisation: 'Cipher Commons',
      owner: 'Mara Chen',
      status: 'new',
      stage: 'Intake',
      priority: 'high',
      nextAction: 'Assign a technical coordinator',
      nextActionAt: new Date(now),
      lastContactAt: null,
    },
    {
      title: 'Developer education series',
      organisation: 'Assembly School',
      owner: 'Niko Reyes',
      status: 'resolved',
      stage: 'Approved',
      priority: 'low',
      nextAction: 'Archive final programme notes',
      nextActionAt: new Date(now + day * 7),
      lastContactAt: new Date(now - day * 2),
    },
    {
      title: 'Local-first tooling pilot',
      organisation: 'Moss Studio',
      owner: 'Jon Bell',
      status: 'in_progress',
      stage: 'Discovery',
      priority: 'medium',
      nextAction: 'Share integration brief',
      nextActionAt: new Date(now + day * 2),
      lastContactAt: new Date(now - day * 3),
    },
    {
      title: 'Research grants intake',
      organisation: 'Independent',
      owner: 'Niko Reyes',
      status: 'closed',
      stage: 'Redirected',
      priority: 'low',
      nextAction: 'No further action',
      nextActionAt: new Date(now + day * 30),
      lastContactAt: new Date(now - day * 14),
    },
  ])
}

await pool.end()
