'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { useAuthStore } from '@/store/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Group {
  id: string
  name: string
  description: string
  status: string
  created_at: string
}

export default function GroupsPage() {
  const [groups, setGroups] = useState<Group[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { user } = useAuthStore()
  const supabase = createClient()

  useEffect(() => {
    const fetchGroups = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('groups')
          .select('*')
          .eq('creator_id', user?.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching groups:', error);
          setError('Failed to load groups');
          return;
        }

        setGroups(data || []);
      } catch (error) {
        console.error('Unexpected error:', error);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroups();
  }, [user]);

  if (isLoading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Groups</h1>
        <Button asChild>
          <Link href="/dashboard/groups/new">Create New Group</Link>
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {groups.length === 0 ? (
        <Card>
          <CardContent className="py-8">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">You haven't created any groups yet.</p>
              <Button asChild>
                <Link href="/dashboard/groups/new">Create Your First Group</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <Card key={group.id}>
              <CardHeader>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>
                  Status: {group.status.charAt(0).toUpperCase() + group.status.slice(1)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                  {group.description}
                </p>
                <Button asChild variant="outline" className="w-full">
                  <Link href={`/dashboard/groups/${group.id}`}>View Details</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
} 