import { DirectoryDetailPage } from '@/components/directory-detail-page'

interface OrganisationPageProps {
  params: Promise<{ id: string }>
}

export default async function OrganisationPage({
  params,
}: OrganisationPageProps) {
  const { id } = await params
  return <DirectoryDetailPage id={id} mode="organisations" />
}
