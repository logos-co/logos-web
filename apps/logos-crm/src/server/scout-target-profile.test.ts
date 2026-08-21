import { describe, expect, test } from 'vitest'

import { evidence, type ScoutCandidateSeed } from '@/server/db/scout-fixtures'

import {
  buildSourceQuery,
  matchesTargetProfile,
  rankSyntheticCandidates,
  type ScoutTargetProfile,
} from './scout-target-profile'

const target: ScoutTargetProfile = {
  query: 'privacy infrastructure',
  organisationTypes: ['cooperative'],
  themes: ['networking'],
  exclusions: ['audience analytics'],
  regions: ['Europe'],
  activeWithinMonths: 12,
}

function candidate(
  displayName: string,
  summary: string,
  releaseDate: string
): ScoutCandidateSeed {
  return {
    displayName,
    entityType: 'organisation',
    domain: `${displayName.toLocaleLowerCase('en').replaceAll(' ', '-')}.example`,
    summary,
    firstSeenDaysAgo: 0,
    lastObservedDaysAgo: 0,
    evidence: [
      evidence(
        'recent_release',
        `Latest release dated ${releaseDate}`,
        'https://source.example/releases',
        'Releases',
        `Release published ${releaseDate}.`
      ),
    ],
  }
}

describe('Scout target profiles', () => {
  test('build the approved-source query from every positive target field', () => {
    expect(buildSourceQuery(target)).toBe(
      'privacy infrastructure networking cooperative Europe'
    )
  })

  test('exclude unwanted results and stale published work', () => {
    const now = new Date('2026-08-21T12:00:00.000Z').getTime()

    expect(
      matchesTargetProfile(
        candidate(
          'Current Network',
          'Privacy-preserving networking infrastructure.',
          '2026-07-01'
        ),
        target,
        now
      )
    ).toBe(true)
    expect(
      matchesTargetProfile(
        candidate(
          'Analytics Vendor',
          'Audience analytics for publishers.',
          '2026-07-01'
        ),
        target,
        now
      )
    ).toBe(false)
    expect(
      matchesTargetProfile(
        candidate(
          'Dormant Network',
          'Privacy-preserving networking infrastructure.',
          '2024-01-01'
        ),
        target,
        now
      )
    ).toBe(false)
  })

  test('rank matching synthetic examples and omit unrelated fixtures', () => {
    const now = new Date('2026-08-21T12:00:00.000Z').getTime()
    const privacy = candidate(
      'Privacy Network',
      'Privacy infrastructure for community networking.',
      '2026-08-01'
    )
    const storage = candidate(
      'Archive Store',
      'Long-term document storage.',
      '2026-08-01'
    )

    expect(rankSyntheticCandidates([storage, privacy], target, now)).toEqual([
      privacy,
    ])
  })
})
