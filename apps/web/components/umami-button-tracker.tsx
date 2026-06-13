'use client'

import { useEffect } from 'react'

import {
  buildButtonClickEventData,
  buildButtonClickEventName,
  getTrackableButton,
  shouldTrackButtonClick,
  type ButtonClickEventData,
} from '@/lib/umami-button-tracking'

interface UmamiAnalytics {
  track: (eventName: string, eventData?: ButtonClickEventData) => void
}

interface UmamiWindow extends Window {
  umami?: UmamiAnalytics
}

const getUmami = (): UmamiAnalytics | undefined =>
  (window as UmamiWindow).umami

export default function UmamiButtonTracker() {
  useEffect(() => {
    const handleClick = (event: MouseEvent) => {
      const button = getTrackableButton(event.target)

      if (!shouldTrackButtonClick(button)) {
        return
      }

      getUmami()?.track(
        buildButtonClickEventName(button),
        buildButtonClickEventData(window.location.pathname)
      )
    }

    document.addEventListener('click', handleClick)

    return () => {
      document.removeEventListener('click', handleClick)
    }
  }, [])

  return null
}
