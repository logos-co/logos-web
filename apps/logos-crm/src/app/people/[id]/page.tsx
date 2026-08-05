import { DirectoryDetailPage } from '@/components/directory-detail-page'

interface PersonPageProps {
  params: Promise<{ id: string }>
}

export default async function PersonPage({ params }: PersonPageProps) {
  const { id } = await params
  return <DirectoryDetailPage id={id} mode="people" />
}
