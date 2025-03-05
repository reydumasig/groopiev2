'use client'

import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { GroupSettings } from '@/components/group/GroupSettings'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

interface GroupData {
  id: string
  name: string
  description: string
  creator_id: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  updated_at: string
  slack_channel_url: string | null
  whatsapp_group_url: string | null
  group_type: 'slack' | 'whatsapp'
  plans: Plan[]
}

interface SubscriptionData {
  id: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  user_id: string
  plan_id: string
  plan: {
    id: string
    name: string
    price: number
  }
}

interface Subscription {
  id: string
  status: 'active' | 'inactive' | 'pending'
  created_at: string
  user_id: string
  profile: {
    full_name: string | null
    email: string
  }
  plan: {
    id: string
    name: string
    price: number
  }
}

export default function GroupDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const [group, setGroup] = useState<GroupData | null>(null)
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const { user } = useAuthStore()
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !resolvedParams.id) return

      try {
        // First, fetch the group with its plans
        const { data: groupData, error: groupError } = await supabase
          .from('groups')
          .select(`
            *,
            plans (
              id,
              name,
              description,
              price,
              features
            )
          `)
          .eq('id', resolvedParams.id)
          .single()

        if (groupError) {
          console.error('Error fetching group:', groupError)
          setError('Failed to load group')
          return
        }

        // Check if user owns the group
        if (groupData.creator_id !== user.id) {
          router.push('/dashboard/groups')
          return
        }

        // Ensure plans have features array
        const groupWithFeatures: GroupData = {
          ...groupData,
          plans: groupData.plans.map((plan: Plan) => ({
            ...plan,
            features: plan.features || []
          }))
        }

        setGroup(groupWithFeatures)

        // Then fetch subscriptions with plan details
        const { data: subscriptionData, error: subscriptionError } = await supabase
          .from('subscriptions')
          .select(`
            id,
            status,
            created_at,
            user_id,
            plan_id,
            plan:plans!plan_id(
              id,
              name,
              price
            )
          `)
          .eq('group_id', resolvedParams.id)

        if (subscriptionError) {
          console.error('Error fetching subscriptions:', subscriptionError)
          return
        }

        // Fetch profiles for each subscription
        const subscriptionsWithProfiles = await Promise.all(
          (subscriptionData || []).map(async (sub: SubscriptionData) => {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', sub.user_id)
              .single()

            const subscription: Subscription = {
              id: sub.id,
              status: sub.status,
              created_at: sub.created_at,
              user_id: sub.user_id,
              profile: profileData || { full_name: null, email: 'No email' },
              plan: sub.plan
            }

            return subscription
          })
        )

        setSubscriptions(subscriptionsWithProfiles)
      } catch (error) {
        console.error('Error fetching data:', error)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [resolvedParams.id, user, router, supabase])

  const handleApproveSubscription = async (subscriptionId: string) => {
    if (!group) return

    setIsProcessing(true)
    try {
      // Update subscription status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({ status: 'active' })
        .eq('id', subscriptionId)

      if (updateError) throw updateError

      // Get subscription details for email
      const { data: subscription, error: subError } = await supabase
        .from('subscriptions')
        .select(`
          *,
          profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('id', subscriptionId)
        .single()

      if (subError) throw subError

      // Send approval email with Slack invite
      const response = await fetch(`/api/groups/${group.id}/approve-member`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: subscription.profiles.email,
          subscriptionId
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message)
      }

      // Update local state
      setSubscriptions(prev =>
        prev.map(sub =>
          sub.id === subscriptionId
            ? { ...sub, status: 'active' }
            : sub
        )
      )

      alert('Member approved successfully!')
    } catch (error) {
      console.error('Error approving subscription:', error)
      setError('Failed to approve subscription')
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Loading group details...</p>
      </div>
    )
  }

  if (error || !group) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error || 'Group not found'}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">{group.name}</h1>
        <Button 
          variant="outline"
          onClick={() => router.push('/dashboard/groups')}
        >
          Back to Groups
        </Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Group Information</CardTitle>
              <CardDescription>
                Status: {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium">Description</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {group.description}
                </p>
              </div>

              {group.group_type === 'slack' && (
                <div>
                  <h3 className="font-medium">Slack Integration</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    {group.slack_channel_url ? (
                      <div className="space-y-2">
                        <p>Slack channel connected</p>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (group.slack_channel_url) {
                                window.open(group.slack_channel_url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            Open in Slack
                          </Button>
                        </div>
                      </div>
                    ) : (
                      'No Slack channel connected'
                    )}
                  </div>
                </div>
              )}

              {group.group_type === 'whatsapp' && (
                <div>
                  <h3 className="font-medium">WhatsApp Integration</h3>
                  <div className="text-sm text-muted-foreground mt-1">
                    {group.whatsapp_group_url ? (
                      <div className="space-y-2">
                        <p>WhatsApp group connected</p>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              if (group.whatsapp_group_url) {
                                window.open(group.whatsapp_group_url, '_blank', 'noopener,noreferrer');
                              }
                            }}
                          >
                            Open in WhatsApp
                          </Button>
                        </div>
                      </div>
                    ) : (
                      'No WhatsApp group connected'
                    )}
                  </div>
                </div>
              )}

              <div>
                <h3 className="font-medium">Created At</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {new Date(group.created_at).toLocaleDateString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="members">
          <Card>
            <CardHeader>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Manage your group members and subscription requests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No subscription requests or members yet
                </p>
              ) : (
                <div className="space-y-4">
                  {subscriptions.map((subscription) => (
                    <Card key={subscription.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">
                              {subscription.profile.full_name || subscription.profile.email}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Plan: {subscription.plan.name} (${subscription.plan.price}/month)
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Status: {subscription.status}
                            </p>
                          </div>
                          {subscription.status === 'pending' && (
                            <Button
                              onClick={() => handleApproveSubscription(subscription.id)}
                              disabled={isProcessing}
                            >
                              {isProcessing ? 'Processing...' : 'Approve'}
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <GroupSettings 
            group={group} 
            onUpdate={async () => {
              setIsLoading(true)
              try {
                // First, fetch the group with its plans
                const { data: groupData, error: groupError } = await supabase
                  .from('groups')
                  .select(`
                    *,
                    plans (
                      id,
                      name,
                      description,
                      price,
                      features
                    )
                  `)
                  .eq('id', resolvedParams.id)
                  .single()

                if (groupError) throw groupError
                setGroup(groupData)
              } catch (error) {
                console.error('Error refreshing group data:', error)
                setError('Failed to refresh group data')
              } finally {
                setIsLoading(false)
              }
            }} 
          />
        </TabsContent>
      </Tabs>
    </div>
  )
} 