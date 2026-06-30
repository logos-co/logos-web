import type { Metadata } from 'next'

const faviconVersion = 'v=20260630'
const versionedFavicon = (path: string) => `${path}?${faviconVersion}`

export const faviconIcons = {
  icon: [
    {
      url: versionedFavicon('/favicon.svg'),
      type: 'image/svg+xml',
      media: '(prefers-color-scheme: light)',
    },
    {
      url: versionedFavicon('/favicon-dark.svg'),
      type: 'image/svg+xml',
      media: '(prefers-color-scheme: dark)',
    },
    {
      url: versionedFavicon('/favicon-32x32.png'),
      sizes: '32x32',
      type: 'image/png',
      media: '(prefers-color-scheme: light)',
    },
    {
      url: versionedFavicon('/favicon-32x32-dark.png'),
      sizes: '32x32',
      type: 'image/png',
      media: '(prefers-color-scheme: dark)',
    },
    {
      url: versionedFavicon('/favicon-16x16.png'),
      sizes: '16x16',
      type: 'image/png',
      media: '(prefers-color-scheme: light)',
    },
    {
      url: versionedFavicon('/favicon-16x16-dark.png'),
      sizes: '16x16',
      type: 'image/png',
      media: '(prefers-color-scheme: dark)',
    },
    {
      url: versionedFavicon('/favicon.ico'),
      sizes: 'any',
      media: '(prefers-color-scheme: light)',
    },
    {
      url: versionedFavicon('/favicon-dark.ico'),
      sizes: 'any',
      media: '(prefers-color-scheme: dark)',
    },
  ],
  apple: [
    { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
  ],
} satisfies Metadata['icons']
