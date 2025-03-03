'use client'

import React from 'react'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Group {
  id: string
  name: string
  description: string
  creator: {
    id: string
    email: string
    fullname: string
  }
  memberCount: number
}

export default function MarketplacePage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const { data: groups, error } = await supabase
          .from('groups')
          .select(`
            *,
            owner:owner_id(
              id,
              email,
              raw_user_meta_data
            ),
            group_members(
              user_id,
              role
            )
          `)
          .eq('status', 'active')
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching groups:', error)
          setError('Failed to load groups')
          return
        }

        const formattedGroups = groups.map(group => ({
          id: group.id,
          name: group.name,
          description: group.description,
          creator: {
            id: group.owner.id,
            email: group.owner.email,
            fullname: group.owner.raw_user_meta_data?.full_name || 'Unknown'
          },
          memberCount: group.group_members.length
        }))

        setGroups(formattedGroups)
      } catch (error) {
        console.error('Unexpected error:', error)
        setError('An unexpected error occurred')
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroups()
  }, [])

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-8">Marketplace</h1>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <p className="text-center text-muted-foreground">
              No groups available in the marketplace
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id} className="flex flex-col">
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>
                  By {group.creator.fullname}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {group.description}
                </p>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Members: {group.memberCount}</p>
                </div>
              </CardContent>
              <CardContent className="pt-0">
                <Button asChild className="w-full">
                  <Link href={`/dashboard/marketplace/${group.id}`}>
                    View Details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 