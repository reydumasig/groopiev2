'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  features: string[]
}

interface Group {
  id: string
  name: string
  description: string
  plans: Plan[]
}

interface Creator {
  id: string
  full_name: string
  avatar_url: string
}

export default function CreatorProfilePage({
  params,
}: {
  params: { uuid: string }
}) {
  const [creator, setCreator] = useState<Creator | null>(null)
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function fetchCreatorProfile() {
      try {
        // Fetch creator profile
        const { data: creatorData, error: creatorError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .eq('id', params.uuid)
          .single()

        if (creatorError) throw creatorError
        if (!creatorData) throw new Error('Creator not found')

        setCreator(creatorData)

        // Fetch creator's active groups with their plans
        const { data: groupsData, error: groupsError } = await supabase
          .from('groups')
          .select(`
            id,
            name,
            description,
            plans (
              id,
              name,
              description,
              price,
              features
            )
          `)
          .eq('creator_id', params.uuid)
          .eq('status', 'active')

        if (groupsError) throw groupsError

        // Sort plans by price for each group
        const groupsWithSortedPlans = groupsData.map(group => ({
          ...group,
          plans: group.plans.sort((a: Plan, b: Plan) => a.price - b.price).slice(0, 3)
        }))

        setGroups(groupsWithSortedPlans)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile')
      } finally {
        setLoading(false)
      }
    }

    fetchCreatorProfile()
  }, [params.uuid, supabase])

  const handleSubscribe = (planId: string) => {
    router.push(`/checkout/${planId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (error || !creator) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-red-500">
              {error || 'Creator not found'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            {creator.avatar_url && (
              <img
                src={creator.avatar_url}
                alt={creator.full_name}
                className="w-16 h-16 rounded-full"
              />
            )}
            <div>
              <CardTitle>{creator.full_name}</CardTitle>
              <CardDescription>Creator Profile</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {groups.map((group) => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-3">
              {group.plans.map((plan) => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>
                      ${plan.price.toFixed(2)} / month
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 mb-4">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="flex items-center">
                          <svg
                            className="w-4 h-4 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full"
                      onClick={() => handleSubscribe(plan.id)}
                    >
                      Subscribe
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
} 