import { lookup } from 'mrmime'

export const CMS_UPLOAD_MIME_TYPES = [
  'image/avif',
  'image/bmp',
  'image/gif',
  'image/heic',
  'image/heif',
  'image/jpeg',
  'image/png',
  'image/tiff',
  'image/webp',
]

export const isAllowedCmsUpload = (filename: string): boolean => {
  const mimeType = lookup(filename)
  return mimeType !== undefined && CMS_UPLOAD_MIME_TYPES.includes(mimeType)
}
