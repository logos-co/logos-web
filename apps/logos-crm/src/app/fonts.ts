import localFont from 'next/font/local'

export const rhymesDisplay = localFont({
  src: '../../../web/public/fonts/rhymes-display/rhymes-display-regular.woff2',
  display: 'swap',
  variable: '--next-font-display',
  fallback: ['Times New Roman', 'Georgia', 'serif'],
})
