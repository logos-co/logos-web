import nextConfig from '../../packages/config/eslint/next.mjs'

export default [
  {
    ignores: ['src/app/(payload)/admin/importMap.js'],
  },
  ...nextConfig,
]
