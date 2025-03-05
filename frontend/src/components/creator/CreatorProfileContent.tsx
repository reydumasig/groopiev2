'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import Link from 'next/link'

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
  status: 'active'
  plans: Plan[]
}

interface CreatorProfile {
  id: string
  full_name: string
  avatar_url: string
  groups: Group[]
}

export function CreatorProfileContent({ creatorId }: { creatorId: string }) {
  const [profile, setProfile] = useState<CreatorProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchCreatorProfile = async () => {
      try {
        const { data, error } = await supabase
          .from('public_creator_details')
          .select('*')
          .eq('id', creatorId)
          .single()

        if (error) {
          if (error.code === 'PGRST116') {
            setError('Creator profile not found')
          } else {
            setError('Failed to load creator profile')
          }
          return
        }

        setProfile(data)
      } catch (err) {
        console.error('Error fetching profile:', err)
        setError('Failed to load creator profile')
      } finally {
        setIsLoading(false)
      }
    }

    fetchCreatorProfile()
  }, [creatorId])

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertDescription>{error || 'Creator profile not found'}</AlertDescription>
        </Alert>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-8">
      {/* Creator Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            {profile.avatar_url && (
              <img
                src={profile.avatar_url}
                alt={profile.full_name}
                className="h-16 w-16 rounded-full"
              />
            )}
            <div>
              <CardTitle>{profile.full_name}</CardTitle>
              <CardDescription>
                {profile.groups.length} Active {profile.groups.length === 1 ? 'Group' : 'Groups'}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Groups and Plans */}
      {profile.groups.map(group => (
        <Card key={group.id}>
          <CardHeader>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>{group.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              {(group.plans || []).slice(0, 3).map(plan => (
                <Card key={plan.id}>
                  <CardHeader>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>${plan.price.toFixed(2)} / month</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-2 mb-4">
                      {plan.features?.map((feature, index) => (
                        <li key={index} className="text-sm text-muted-foreground">
                          {feature}
                        </li>
                      ))}
                    </ul>
                    <Button asChild className="w-full">
                      <Link href={`/checkout/${plan.id}`}>Subscribe</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {profile.groups.length === 0 && (
        <Card>
          <CardContent className="py-8">
            <div className="text-center text-muted-foreground">
              This creator has no active groups at the moment.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 