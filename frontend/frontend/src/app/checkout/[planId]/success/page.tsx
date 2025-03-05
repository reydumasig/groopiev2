import { Suspense } from 'react'
import { SuccessContent } from '@/components/checkout/SuccessContent'

interface Props {
  params: {
    planId: string
  },
  searchParams: {
    subscription: string
  }
}

export default async function SuccessPage({ params, searchParams }: Props) {
  const planId = await Promise.resolve(params.planId)
  const subscriptionId = searchParams.subscription

  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    }>
      <SuccessContent planId={planId} subscriptionId={subscriptionId} />
    </Suspense>
  )
} 