'use client'

import { useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import { useEffect, useRef, useState, type FormEvent } from 'react'

// Direct, not through the barrel: that would drag the funnel form (and
// hCaptcha) into this page's bundle.
import { ConnectPageLayout } from '@/components/sections/connect/connect-page-layout'
import { FieldLabel } from '@/components/sections/connect/form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'
import {
  fetchOnePagerLinkStatus,
  ONE_PAGER_ACCEPT,
  ONE_PAGER_MAX_MB,
  submitOnePager,
  validateOnePagerFile,
  type FileError,
  type LinkStatus,
} from '@/lib/one-pager-upload'

type Outcome = 'ready' | 'uploading' | 'success' | 'used'

const FILE_ERROR_KEY: Record<FileError, string> = {
  type: 'errorType',
  empty: 'errorEmpty',
  size: 'errorSize',
}

/** Standalone message for every state that offers nothing to do. */
function Notice({
  heading,
  body,
  tone = 'neutral',
}: {
  heading: string
  body: string
  tone?: 'neutral' | 'success'
}) {
  return (
    <div
      className={cn(
        'rounded border bg-white px-6 py-8 text-center',
        tone === 'success'
          ? 'border-brand-dark-green/30'
          : 'border-brand-dark-green/20'
      )}
    >
      <h2 className="font-display text-[22px] leading-[1.2] tracking-[-0.6px]">
        {heading}
      </h2>
      <p className="mx-auto mt-3 max-w-[46em] text-balance font-sans text-[16px] leading-[1.4] text-brand-dark-green/80">
        {body}
      </p>
    </div>
  )
}

export function OnePagerUpload() {
  const t = useTranslations('pages.onePager')
  const token = useSearchParams().get('t')

  // `null` while the check is in flight -- distinct from a resolved `'unknown'`,
  // which falls through to the form.
  const [linkStatus, setLinkStatus] = useState<LinkStatus | null>(null)
  const [outcome, setOutcome] = useState<Outcome>('ready')
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!token) return
    let cancelled = false

    fetchOnePagerLinkStatus(token).then((status) => {
      if (!cancelled) setLinkStatus(status)
    })

    return () => {
      cancelled = true
    }
  }, [token])

  if (!token) {
    return (
      <ConnectPageLayout heading={t('heading')} showMark={false}>
        <Notice
          heading={t('missingTokenHeading')}
          body={t('missingTokenBody')}
        />
      </ConnectPageLayout>
    )
  }

  if (linkStatus === null) {
    return (
      <ConnectPageLayout heading={t('heading')} showMark={false}>
        <p className="text-center font-mono text-xs leading-[1.3] text-brand-dark-green/70">
          {t('checking')}
        </p>
      </ConnectPageLayout>
    )
  }

  if (linkStatus === 'invalid') {
    return (
      <ConnectPageLayout heading={t('heading')} showMark={false}>
        <Notice heading={t('invalidHeading')} body={t('invalidBody')} />
      </ConnectPageLayout>
    )
  }

  if (outcome === 'used' || linkStatus === 'used') {
    return (
      <ConnectPageLayout heading={t('heading')} showMark={false}>
        <Notice heading={t('usedHeading')} body={t('usedBody')} />
      </ConnectPageLayout>
    )
  }

  if (outcome === 'success') {
    return (
      <ConnectPageLayout heading={t('heading')} showMark={false}>
        <Notice
          heading={t('successHeading')}
          body={t('successBody')}
          tone="success"
        />
      </ConnectPageLayout>
    )
  }

  const uploading = outcome === 'uploading'

  const handleFileChange = () => {
    const picked = inputRef.current?.files?.[0] ?? null
    setError(null)

    if (!picked) {
      setFile(null)
      return
    }

    const validation = validateOnePagerFile(picked)
    if (!validation.ok) {
      setFile(null)
      setError(t(FILE_ERROR_KEY[validation.reason], { maxMb: ONE_PAGER_MAX_MB }))
      return
    }

    setFile(picked)
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault()
    if (!file || uploading) return

    setOutcome('uploading')
    setError(null)

    const result = await submitOnePager(token, file, t('errorGeneric'))

    if (result.status === 'ok') {
      setOutcome('success')
      return
    }
    if (result.status === 'used') {
      setOutcome('used')
      return
    }

    setOutcome('ready')
    setError(result.message)
  }

  return (
    <ConnectPageLayout
      heading={t('heading')}
      showMark={false}
      intro={
        <p className="mx-auto max-w-[46em] text-balance font-sans text-[16px] leading-[1.4] text-brand-dark-green/80">
          {t('intro')}
        </p>
      }
    >
      <form
        onSubmit={handleSubmit}
        className="rounded border border-brand-dark-green/20 bg-white px-6 py-8"
      >
        <p
          id="one-pager-requirements"
          className="font-mono text-xs leading-[1.3] text-brand-dark-green/80"
        >
          {t('requirements', { maxMb: ONE_PAGER_MAX_MB })}
        </p>

        <div className="mt-6">
          <FieldLabel htmlFor="one-pager-file">{t('chooseFile')}</FieldLabel>
          <input
            ref={inputRef}
            id="one-pager-file"
            type="file"
            accept={ONE_PAGER_ACCEPT}
            onChange={handleFileChange}
            disabled={uploading}
            aria-describedby="one-pager-requirements"
            aria-invalid={error ? true : undefined}
            className={cn(
              'w-full cursor-pointer rounded border border-brand-dark-green/30 px-3 py-2.5 font-sans text-[16px] leading-[1.2] text-brand-dark-green file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-brand-dark-green file:px-3 file:py-1.5 file:font-mono file:text-xs file:text-brand-off-white disabled:cursor-not-allowed disabled:opacity-60',
              error && 'border-red-600'
            )}
          />
        </div>

        {/* Always mounted: a live region inserted alongside its message is
            announced unreliably. */}
        <p
          className="mt-3 min-h-4 font-mono text-xs leading-[1.3] font-semibold text-red-600"
          aria-live="polite"
        >
          {error}
        </p>

        <div className="mt-5">
          <Button
            type="submit"
            variant="primary"
            icon={false}
            disabled={!file || uploading}
            className={cn((!file || uploading) && 'pointer-events-none opacity-60')}
          >
            {uploading ? t('submitting') : t('submit')}
          </Button>
        </div>
      </form>
    </ConnectPageLayout>
  )
}
