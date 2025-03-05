import { Suspense } from 'react'
import { CheckoutContent } from '@/components/checkout/CheckoutContent'

interface Props {
  params: {
    planId: string
  }
}

export default async function CheckoutPage({ params }: Props) {
  const planId = await Promise.resolve(params.planId)

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
      <CheckoutContent planId={planId} />
    </Suspense>
  )
} 