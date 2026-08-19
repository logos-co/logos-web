import type { JsonLdObject } from '@/lib/structured-data'

type Props = {
  data: JsonLdObject
}

export function JsonLd({ data }: Props) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c')

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  )
}
