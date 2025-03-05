'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, CheckCircle2 } from 'lucide-react'

interface Subscription {
  id: string
  status: string
  created_at: string
  current_period_start: string
  current_period_end: string
  plan: {
    id: string
    name: string
    price: number
    group: {
      id: string
      name: string
      description: string
    }
  }
}

interface Props {
  planId: string
  subscriptionId: string
}

export function SuccessContent({ planId, subscriptionId }: Props) {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            plan:plans (
              *,
              group:groups (
                id,
                name,
                description
              )
            )
          `)
          .eq('id', subscriptionId)
          .single()

        if (error) throw error
        setSubscription(data)
      } catch (error) {
        console.error('Error fetching subscription:', error)
        setError('Failed to load subscription details')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscription()
  }, [subscriptionId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="py-10">
            <div className="flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>Subscription not found</AlertDescription>
        </Alert>
      </div>
    )
  }

  const startDate = new Date(subscription.current_period_start).toLocaleDateString()
  const endDate = new Date(subscription.current_period_end).toLocaleDateString()

  return (
    <div className="container mx-auto py-10">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
              <div>
                <CardTitle>Payment Successful!</CardTitle>
                <CardDescription>
                  Your subscription has been activated
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium">Subscription Details</h3>
                <div className="mt-2 space-y-2">
                  <p>
                    <span className="text-muted-foreground">Group:</span>{' '}
                    {subscription.plan.group.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Plan:</span>{' '}
                    {subscription.plan.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Price:</span>{' '}
                    ${subscription.plan.price}/month
                  </p>
                  <p>
                    <span className="text-muted-foreground">Billing Period:</span>{' '}
                    {startDate} - {endDate}
                  </p>
                </div>
              </div>

              <Alert>
                <AlertDescription>
                  You can manage your subscription from your dashboard at any time.
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button variant="outline" asChild>
              <Link href={`/creator/${subscription.plan.group.id}`}>
                View Group
              </Link>
            </Button>
            <Button asChild>
              <Link href="/dashboard/subscriptions">
                View My Subscriptions
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
} 