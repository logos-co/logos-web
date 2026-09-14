'use client'

import { useCallback, useRef, useState } from 'react'

import type { CidBreakdown } from '@/lib/storage-cid'
import { computeCid } from '@/lib/storage-cid'
import { isAcceptedMimetype } from '@/lib/storage-mimetypes'

/**
 * Files larger than this are refused.
 *
 * Hashing is synchronous work on the main thread, and a big file would freeze
 * the tab. The demo is about what the CID is, not about throughput.
 */
export const MAX_FILE_BYTES = 8 * 1024 * 1024

export type ComputedFile = {
  name: string
  /** What went into the manifest. Null when the node would have refused it. */
  mimetype: string | null
  /** What the browser reported, kept so the page can explain a refusal. */
  reportedMimetype: string
  bytes: Uint8Array
  breakdown: CidBreakdown
}

export type CidState = {
  file: ComputedFile | null
  isComputing: boolean
  error: string | null
}

const IDLE: CidState = { file: null, isComputing: false, error: null }

const readableSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${Math.round(bytes / 1024)} KB`

export function useCidCompute() {
  const [state, setState] = useState<CidState>(IDLE)

  // Dropping a second file while the first is still hashing must not let the
  // slower one win.
  const currentRef = useRef(0)

  const compute = useCallback(async (file: File) => {
    const token = currentRef.current + 1
    currentRef.current = token

    if (file.size === 0) {
      setState({
        file: null,
        isComputing: false,
        error: 'Logos Storage rejects an empty file, so it has no CID.',
      })
      return
    }

    if (file.size > MAX_FILE_BYTES) {
      setState({
        file: null,
        isComputing: false,
        error: `That file is ${readableSize(file.size)}. This page hashes in the tab, so it stops at ${readableSize(MAX_FILE_BYTES)}.`,
      })
      return
    }

    setState({ file: null, isComputing: true, error: null })

    try {
      const bytes = new Uint8Array(await file.arrayBuffer())

      // The node reads the mimetype from the request's Content-Type and the
      // name from Content-Disposition. Both go into the manifest, so both
      // change the CID. A renamed file is a different CID.
      const reportedMimetype = file.type

      /**
       * One rule for the type, so the CID is always explainable.
       *
       * Use what the browser reports when a node would accept it, and nothing
       * otherwise. Both other cases are the same situation, so they get the
       * same answer: a browser that reports no type at all, and a type the
       * node refuses because it cannot map it to a file extension, which is
       * every `.md` file. Uploading with no Content-Type is allowed and the
       * manifest then records none, so that is the upload this CID describes.
       */
      const mimetype =
        reportedMimetype && isAcceptedMimetype(reportedMimetype)
          ? reportedMimetype
          : null

      const breakdown = await computeCid(bytes, {
        filename: file.name,
        mimetype,
      })

      if (currentRef.current !== token) return
      setState({
        file: {
          name: file.name,
          mimetype,
          reportedMimetype,
          bytes,
          breakdown,
        },
        isComputing: false,
        error: null,
      })
    } catch (cause) {
      if (currentRef.current !== token) return
      setState({
        file: null,
        isComputing: false,
        error:
          cause instanceof Error ? cause.message : 'Could not read that file.',
      })
    }
  }, [])

  const reset = useCallback(() => {
    currentRef.current += 1
    setState(IDLE)
  }, [])

  return { ...state, compute, reset }
}
