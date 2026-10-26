import { describe, expect, it } from 'vitest'

import { resolveVersionBadges } from '../version-badges'

const templates = ['Basecamp v{version}', 'Testnet v{version}']

describe('Basecamp hero version badges', () => {
  it('follows the Basecamp release tag and the active roadmap testnet release', () => {
    expect(resolveVersionBadges(templates, 'v0.4.1', 'TESTNET V0.4')).toEqual([
      'Basecamp v0.4.1',
      'Testnet v0.4',
    ])
  })

  it('rejects a roadmap label that does not identify a testnet release', () => {
    expect(() => resolveVersionBadges(templates, '0.4.1', 'MAINNET')).toThrow(
      /Invalid active roadmap testnet tab/
    )
  })
})
