import { Suspense } from 'react'
import { CreatorProfileContent } from '@/components/creator/CreatorProfileContent'

interface Props {
  params: {
    id: string
  }
}

export default async function CreatorProfilePage({ params }: Props) {
  // Ensure params.id is resolved before rendering
  const id = await Promise.resolve(params.id)

  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <CreatorProfileContent creatorId={id} />
    </Suspense>
  )
} 