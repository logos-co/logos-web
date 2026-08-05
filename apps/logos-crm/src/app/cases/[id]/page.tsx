import { CaseDetailPage } from '@/components/case-detail-page'

interface CasePageProps {
  params: Promise<{ id: string }>
}

export default async function CasePage({ params }: CasePageProps) {
  const { id } = await params
  return <CaseDetailPage id={id} />
}
