'use client'

import { useEffect, useState } from 'react'

const PROBE =
  'data:image/avif;base64,AAAAHGZ0eXBhdmlmAAAAAG1pZjFhdmlmbWlhZgAAANZtZXRhAAAAAAAAACFoZGxyAAAAAAAAAABwaWN0AAAAAAAAAAAAAAAAAAAAACJpbG9jAAAAAERAAAEAAQAAAAAA+gABAAAAAAAAAB0AAAAjaWluZgAAAAAAAQAAABVpbmZlAgAAAAABAABhdjAxAAAAAA5waXRtAAAAAAABAAAAVmlwcnAAAAA4aXBjbwAAAAxhdjFDgSACAAAAABRpc3BlAAAAAAAAAAEAAAABAAAAEHBpeGkAAAAAAwgICAAAABZpcG1hAAAAAAAAAAEAAQOBAgMAAAAlbWRhdBIACgc4AAaQENBpMhAZQmMEwAA0AACQQMkcYIpq'

let probe: Promise<boolean> | null = null

function detectAvif(): Promise<boolean> {
  probe ??= new Promise((resolve) => {
    const image = new Image()
    image.onload = () => resolve(image.naturalWidth > 0)
    image.onerror = () => resolve(false)
    image.src = PROBE
  })
  return probe
}

/** `null` until the browser has tried to decode a 1px AVIF. */
export function useAvifSupport(): boolean | null {
  const [supported, setSupported] = useState<boolean | null>(null)
  useEffect(() => {
    let active = true
    void detectAvif().then((result) => {
      if (active) setSupported(result)
    })
    return () => {
      active = false
    }
  }, [])
  return supported
}
