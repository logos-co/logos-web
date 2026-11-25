import localFont from 'next/font/local'

export const rhymesText = localFont({
  src: '../../../../../../past-present-future/static/fonts/rhymes-text.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--field-text-font',
  fallback: ['Times New Roman', 'Georgia', 'serif'],
})

export const newsreader = localFont({
  src: '../../../../../public/fonts/newsreader/newsreader-latin-400.woff2',
  weight: '400',
  style: 'normal',
  display: 'swap',
  variable: '--field-mobile-title-font',
  fallback: ['Times New Roman', 'Georgia', 'serif'],
})
