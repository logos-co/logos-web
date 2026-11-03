'use client'

import { useEffect } from 'react'

interface TwitterWindow extends Window {
  twttr?: { widgets: { load: (element: HTMLElement) => void } }
}

/** The quotation and links are already in the HTML before the widget loads. */
export function TweetEnhancement({ slug }: { slug: string }) {
  useEffect(() => {
    const content = document.querySelector<HTMLElement>('.media-detail-content')
    if (!content?.querySelector('.twitter-tweet')) return
    const render = () => (window as TwitterWindow).twttr?.widgets.load(content)
    if ((window as TwitterWindow).twttr?.widgets) {
      render()
      return
    }
    let script = document.querySelector<HTMLScriptElement>(
      '#media-twitter-widgets'
    )
    if (!script) {
      script = document.createElement('script')
      script.id = 'media-twitter-widgets'
      script.src = 'https://platform.twitter.com/widgets.js'
      script.async = true
      document.body.append(script)
    }
    script.addEventListener('load', render)
    return () => script.removeEventListener('load', render)
  }, [slug])
  return null
}
