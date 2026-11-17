import localFont from 'next/font/local'

export const programmeMono = localFont({
  src: '../../../public/fonts/fira-code/fira-code-latin-wght.woff2',
  weight: '400 600',
  style: 'normal',
  display: 'swap',
  variable: '--developer-programmes-mono',
})
