import { extname } from 'node:path'

export const cmsTagName = (name: string): string =>
  name.trim().replace(/[\s-]+/g, '_')

export const cmsAssetName = (name: string): string =>
  name.length > 100 ? name.slice(0, 16) + extname(name) : name
