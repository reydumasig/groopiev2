'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

interface Group {
  id: string
  name: string
  description: string
  status: string
  creator_id: string
  creator_name: string
  creator_email: string
  creator_avatar: string
  created_at: string
}

export function PendingGroups() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('pending')
  const supabase = createClient()

  const fetchGroups = async () => {
    try {
      console.log('Fetching groups...')
      const { data: groupsData, error: groupsError } = await supabase
        .from('admin_group_details')
        .select('*')
        .in('status', activeTab === 'pending' ? ['pending'] : ['inactive'])
        .order('created_at', { ascending: false })

      console.log('Groups query result:', { groupsData, groupsError })

      if (groupsError) {
        console.error('Error fetching groups:', groupsError)
        setError('Failed to load groups')
        return
      }

      if (!groupsData || groupsData.length === 0) {
        console.log('No groups found')
        setGroups([])
        setIsLoading(false)
        return
      }

      console.log('Found groups:', groupsData.length)
      setGroups(groupsData)
    } catch (error) {
      console.error('Error fetching groups:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [activeTab])

  const handleApprove = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('approve_group', {
          group_id: groupId
        })

      if (error) {
        console.error('Error approving group:', error)
        setError('Failed to approve group')
        return
      }

      await fetchGroups()
    } catch (error) {
      console.error('Error approving group:', error)
      setError('Failed to approve group')
    }
  }

  const handleReject = async (groupId: string) => {
    try {
      const response = await fetch(`/api/admin/groups/${groupId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error('Failed to reject group')
      }

      await fetchGroups()
    } catch (error) {
      console.error('Error rejecting group:', error)
      setError('Failed to reject group')
    }
  }

  const handleReactivate = async (groupId: string) => {
    try {
      const { data, error } = await supabase
        .rpc('reactivate_group', {
          group_id: groupId
        })

      if (error) {
        console.error('Error reactivating group:', error)
        setError('Failed to reactivate group')
        return
      }

      await fetchGroups()
    } catch (error) {
      console.error('Error reactivating group:', error)
      setError('Failed to reactivate group')
    }
  }

  if (isLoading) return <div>Loading...</div>

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="pending">Pending Groups</TabsTrigger>
          <TabsTrigger value="suspended">Suspended Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <h2 className="text-xl font-semibold">Pending Groups</h2>
          {groups.length === 0 ? (
            <p>No pending groups</p>
          ) : (
            groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <CardTitle>{group.name}</CardTitle>
                  <CardDescription>Created by {group.creator_name} ({group.creator_email})</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{group.description}</p>
                  <div className="flex space-x-2">
                    <Button onClick={() => handleApprove(group.id)}>
                      Approve
                    </Button>
                    <Button variant="destructive" onClick={() => handleReject(group.id)}>
                      Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="suspended" className="space-y-4">
          <h2 className="text-xl font-semibold">Suspended Groups</h2>
          {groups.length === 0 ? (
            <p>No suspended groups</p>
          ) : (
            groups.map((group) => (
              <Card key={group.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{group.name}</CardTitle>
                      <CardDescription>Created by {group.creator_name} ({group.creator_email})</CardDescription>
                    </div>
                    <Badge variant="secondary">Suspended</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="mb-4">{group.description}</p>
                  <Button onClick={() => handleReactivate(group.id)}>
                    Reactivate Group
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 