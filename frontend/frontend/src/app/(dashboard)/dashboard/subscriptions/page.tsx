'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'

interface Subscription {
  id: string
  status: string
  created_at: string
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

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchSubscriptions = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        const { data, error } = await supabase
          .from('subscriptions')
          .select(`
            *,
            plan:plans (
              id,
              name,
              price,
              group:groups (
                id,
                name,
                description
              )
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching subscriptions:', error)
          setError('Failed to load subscriptions')
          return
        }

        setSubscriptions(data || [])
      } catch (error) {
        console.error('Unexpected error:', error)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptions()
  }, [user])

  if (isLoading) {
    return <div>Loading...</div>
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500'
      case 'pending':
        return 'bg-yellow-500'
      case 'cancelled':
        return 'bg-red-500'
      default:
        return 'bg-gray-500'
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">My Subscriptions</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {subscriptions.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              You don't have any subscriptions yet
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {subscriptions.map((subscription) => (
            <Card key={subscription.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{subscription.plan.group.name}</CardTitle>
                  <Badge className={getStatusColor(subscription.status)}>
                    {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
                  </Badge>
                </div>
                <CardDescription>
                  {subscription.plan.name} - ${subscription.plan.price}/month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {subscription.plan.group.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 