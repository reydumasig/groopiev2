'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Group {
  id: string
  name: string
  description: string
  status: string
  creator_id: string
  creator_name: string
  creator_email: string
  creator_avatar: string
  member_count: number
  slack_channel_url: string
  whatsapp_group_url: string
  group_type: 'slack' | 'whatsapp'
  created_at: string
  updated_at: string
}

export function AdminGroupList() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [slackUrl, setSlackUrl] = useState<string>('')
  const [whatsappUrl, setWhatsappUrl] = useState<string>('')
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null)
  const supabase = createClient()

  const fetchGroups = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_group_details')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching groups:', error)
        setError('Failed to load groups')
        return
      }

      setGroups(data || [])
    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchGroups()
  }, [])

  const handleSuspend = async (groupId: string) => {
    try {
      const { error } = await supabase
        .rpc('suspend_group', {
          group_id: groupId
        })

      if (error) {
        console.error('Error suspending group:', error)
        setError('Failed to suspend group')
        return
      }

      await fetchGroups()
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to suspend group')
    }
  }

  const handleUpdateUrl = async (groupId: string) => {
    try {
      const group = groups.find(g => g.id === groupId);
      if (!group) return;

      const { error } = await supabase.rpc(
        group.group_type === 'slack' ? 'update_group_slack' : 'update_group_whatsapp',
        {
          group_id: groupId,
          [group.group_type === 'slack' ? 'slack_url' : 'whatsapp_url']: 
            group.group_type === 'slack' ? slackUrl : whatsappUrl
        }
      );

      if (error) {
        console.error('Error updating URL:', error)
        setError(`Failed to update ${group.group_type === 'slack' ? 'Slack' : 'WhatsApp'} URL`)
        return
      }

      setEditingGroupId(null)
      setSlackUrl('')
      setWhatsappUrl('')
      await fetchGroups()
    } catch (error) {
      console.error('Error:', error)
      setError('Failed to update URL')
    }
  }

  const handleApprove = async (groupId: string) => {
    try {
      const { error } = await supabase
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
      console.error('Error:', error)
      setError('Failed to approve group')
    }
  }

  const handleReactivate = async (groupId: string) => {
    try {
      const { error } = await supabase
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
      console.error('Error:', error)
      setError('Failed to reactivate group')
    }
  }

  if (isLoading) return <div>Loading...</div>

  if (error) {
    return (
      <div className="text-red-500">
        {error}
      </div>
    )
  }

  const pendingGroups = groups.filter(g => g.status === 'pending')
  const activeGroups = groups.filter(g => g.status === 'active')
  const inactiveGroups = groups.filter(g => g.status === 'inactive')

  const GroupCard = ({ group }: { group: Group }) => (
    <Card key={group.id}>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>{group.name}</CardTitle>
            <CardDescription>
              Created by {group.creator_name} ({group.creator_email})
            </CardDescription>
          </div>
          <Badge variant={
            group.status === 'active' ? 'default' :
            group.status === 'pending' ? 'secondary' :
            'destructive'
          }>
            {group.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="mb-4">{group.description}</p>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Members: {group.member_count}</span>
            {group.group_type === 'slack' && group.slack_channel_url && (
              <a href={group.slack_channel_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline">
                Slack Channel
              </a>
            )}
            {group.group_type === 'whatsapp' && group.whatsapp_group_url && (
              <a href={group.whatsapp_group_url} target="_blank" rel="noopener noreferrer" className="text-sm text-green-500 hover:underline">
                WhatsApp Group
              </a>
            )}
          </div>
          
          {editingGroupId === group.id ? (
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={`${group.group_type === 'slack' ? 'Slack Channel' : 'WhatsApp Group'} URL`}
                value={group.group_type === 'slack' ? slackUrl : whatsappUrl}
                onChange={(e) => group.group_type === 'slack' ? setSlackUrl(e.target.value) : setWhatsappUrl(e.target.value)}
              />
              <Button onClick={() => handleUpdateUrl(group.id)}>Save</Button>
              <Button variant="outline" onClick={() => {
                setEditingGroupId(null)
                setSlackUrl('')
                setWhatsappUrl('')
              }}>Cancel</Button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => {
                setEditingGroupId(group.id)
                if (group.group_type === 'slack') {
                  setSlackUrl(group.slack_channel_url || '')
                } else {
                  setWhatsappUrl(group.whatsapp_group_url || '')
                }
              }}>
                Edit {group.group_type === 'slack' ? 'Slack' : 'WhatsApp'} URL
              </Button>
              {group.status === 'active' && (
                <Button variant="destructive" onClick={() => handleSuspend(group.id)} className="text-black">
                  Suspend
                </Button>
              )}
              {group.status === 'pending' && (
                <Button onClick={() => handleApprove(group.id)}>
                  Approve
                </Button>
              )}
              {group.status === 'inactive' && (
                <Button onClick={() => handleReactivate(group.id)}>
                  Reactivate
                </Button>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList>
        <TabsTrigger value="pending">
          Pending ({pendingGroups.length})
        </TabsTrigger>
        <TabsTrigger value="active">
          Active ({activeGroups.length})
        </TabsTrigger>
        <TabsTrigger value="inactive">
          Inactive ({inactiveGroups.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        {pendingGroups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </TabsContent>

      <TabsContent value="active" className="space-y-4">
        {activeGroups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </TabsContent>

      <TabsContent value="inactive" className="space-y-4">
        {inactiveGroups.map(group => (
          <GroupCard key={group.id} group={group} />
        ))}
      </TabsContent>
    </Tabs>
  )
} 