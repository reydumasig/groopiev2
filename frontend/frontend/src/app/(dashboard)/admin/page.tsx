'use client'

import { AdminGroupList } from '@/components/admin/AdminGroupList'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

interface Stats {
  totalGroups: number
  pendingGroups: number
  activeGroups: number
  totalMembers: number
}

export default function AdminPage() {
  const [stats, setStats] = useState<Stats>({
    totalGroups: 0,
    pendingGroups: 0,
    activeGroups: 0,
    totalMembers: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchStats = async () => {
    try {
      // Get group stats
      const { data: groupStats, error: statsError } = await supabase
        .from('admin_group_details')
        .select('status, member_count')

      if (statsError) {
        console.error('Error fetching stats:', statsError)
        setError('Failed to load statistics')
        return
      }

      const stats = {
        totalGroups: groupStats?.length || 0,
        pendingGroups: groupStats?.filter(g => g.status === 'pending').length || 0,
        activeGroups: groupStats?.filter(g => g.status === 'active').length || 0,
        totalMembers: groupStats?.reduce((acc, curr) => acc + (curr.member_count || 0), 0) || 0
      }

      setStats(stats)
    } catch (error) {
      console.error('Error:', error)
      setError('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  if (isLoading) return <div>Loading...</div>

  if (error) {
    return (
      <div className="text-red-500">
        {error}
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalGroups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingGroups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Groups</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeGroups}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
          </CardContent>
        </Card>
      </div>

      <AdminGroupList />
    </div>
  )
} 