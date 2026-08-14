import { ScoutCandidatePage } from '@/components/scout-candidate-page'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ScoutCandidateRoute({ params }: PageProps) {
  const { id } = await params
  return <ScoutCandidatePage candidateId={id} />
}
