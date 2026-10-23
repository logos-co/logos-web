const VERSION_PLACEHOLDER = '{version}'
const TESTNET_TAB = /^TESTNET V(\d+(?:\.\d+){1,2})$/i

function applyVersion(template: string, version: string): string {
  if (template.split(VERSION_PLACEHOLDER).length !== 2) {
    throw new Error(
      'Basecamp version badge must contain one {version} placeholder'
    )
  }
  return template.replace(VERSION_PLACEHOLDER, version)
}

export function resolveVersionBadges(
  templates: readonly string[],
  basecampTag: string,
  activeTestnetTab: string
): [string, string] {
  if (templates.length !== 2 || !templates[0] || !templates[1]) {
    throw new Error('Basecamp hero must have two version badge templates')
  }

  const testnetVersion = TESTNET_TAB.exec(activeTestnetTab)?.[1]
  if (!testnetVersion) {
    throw new Error(`Invalid active roadmap testnet tab: ${activeTestnetTab}`)
  }

  return [
    applyVersion(templates[0], basecampTag.replace(/^v/, '')),
    applyVersion(templates[1], testnetVersion),
  ]
}
