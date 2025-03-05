'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/store/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase'

interface DashboardStats {
  groupCount: number
  totalEarnings: number
  pendingPayout: number
  activeSubscribers: number
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState<DashboardStats>({ 
    groupCount: 0,
    totalEarnings: 0,
    pendingPayout: 0,
    activeSubscribers: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setIsLoading(false)
        return
      }

      try {
        // Fetch groups count
        const { data: groupData, error: groupError } = await supabase
          .from('group_details')
          .select('id')
          .eq('status', 'active')
          .eq('creator_id', user.id)

        if (groupError) throw groupError

        // Fetch active subscribers count and their subscriptions
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('status', 'active')
          .in('group_id', groupData?.map(g => g.id) || [])

        if (subscriptionError) throw subscriptionError

        // Fetch earnings data using subscription IDs
        const { data: earningsData, error: earningsError } = await supabase
          .from('payment_history')
          .select('creator_share')
          .in('subscription_id', subscriptionData?.map(s => s.id) || [])

        if (earningsError) throw earningsError

        // Calculate total earnings and pending payout
        const totalEarnings = earningsData?.reduce((sum, payment) => sum + (payment.creator_share || 0), 0) || 0
        const pendingPayout = totalEarnings % 500 // Only show amount until next $500 threshold

        setStats({ 
          groupCount: groupData?.length || 0,
          activeSubscribers: subscriptionData?.length || 0,
          totalEarnings,
          pendingPayout
        })
      } catch (err) {
        console.error('Error fetching stats:', err)
        setError('Failed to load dashboard stats')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [user, supabase])

  if (!user) {
    return (
      <div className="container mx-auto py-10">
        <Alert>
          <AlertDescription>Please sign in to view your dashboard</AlertDescription>
        </Alert>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>My Groups</CardTitle>
            <CardDescription>
              Groups you&apos;ve created or joined
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? '...' : stats.groupCount}
            </div>
            <p className="text-xs text-muted-foreground">
              Active groups
            </p>
            <Button asChild className="mt-4 w-full">
              <Link href="/dashboard/groups">View Groups</Link>
            </Button>
          </CardContent>
        </Card>

        {stats.groupCount > 0 && (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Active Subscribers</CardTitle>
                <CardDescription>
                  Total active subscribers across groups
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {isLoading ? '...' : stats.activeSubscribers}
                </div>
                <p className="text-xs text-muted-foreground">
                  Current subscribers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Total Earnings</CardTitle>
                <CardDescription>
                  Your total earnings to date
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${isLoading ? '...' : stats.totalEarnings.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Lifetime earnings
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Next Payout</CardTitle>
                <CardDescription>
                  Amount until $500 threshold
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ${isLoading ? '...' : (500 - stats.pendingPayout).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Needed for next payout
                </p>
                <div className="mt-2 h-2 rounded-full bg-secondary">
                  <div 
                    className="h-2 rounded-full bg-primary" 
                    style={{ width: `${(stats.pendingPayout / 500) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          </>
        )}

        <Card className="md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks and actions
            </CardDescription>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard/groups/new">Create New Group</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}